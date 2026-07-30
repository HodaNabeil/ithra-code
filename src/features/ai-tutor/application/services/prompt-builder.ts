import type { MessageDTO } from '../../domain/ports/ConversationRepositoryPort';
import type { TutorSessionContext } from '../../domain/models/TutorSessionContext';
import type { RetrievedContentChunk } from '../dto/retrieved-content.dto';
import { AI_TUTOR_CONSTANTS } from '../../shared';
import { buildAdaptiveFormattingInstructions } from './learning-profile.logic';
import {
  buildLevelAdaptiveInstructions,
  formatCourseLevelLabel,
} from './student-info.service';
import {
  formatAssessmentPerformanceSummary,
  formatKnowledgeGapsForPrompt,
  formatSectionProgressForPrompt,
} from './student-progress-analytics.service';

const BASE_SYSTEM_PROMPT = `أنت مدرس ذكي على منصة IthraCode.
- ساعد الطالب على الفهم بدلاً من إعطاء الإجابة مباشرة عندما يكون ذلك مناسباً.
- اشرح بوضوح وبأسلوب تعليمي مشجع.
- كيّف عمق الشرح وطول الإجابة حسب مستوى الدورة وتقدم الطالب فيها (انظر تعليمات التكييف أدناه).
- اربط إجاباتك بسياق الدورة والمحاضرة الحالية عندما يكون ذلك مفيداً.
- أجب بنفس لغة سؤال الطالب.
- إذا لم تكن متأكداً من الإجابة، قل ذلك بصراحة.
- اعتمد على مواد الدورة المسترجعة أدناه عند الإجابة.
- لا تخترع معلومات غير موجودة في سياق الدورة أو المواد المسترجعة.
- عندما يسأل الطالب عن نفسه (اسمه، تقدمه، مستواه)، استخدم معلومات الطالب من سياق الجلسة أدناه.

## حدود النزاهة التعليمية
- لا تقدّم أبداً إجابات مباشرة لأسئلة الاختبارات أو الواجبات أو مفاتيح الحلول.
- إذا بدا أن الطالب يطلب إجابة تقييم، قدّم تلميحات وإرشاداً نحو المفاهيم بدلاً من الحل النهائي.
- لا تستخدم عبارات مثل "الإجابة الصحيحة هي" أو "الخيار الصحيح هو".
- شجّع الطالب على مراجعة المحاضرات ذات الصلة وطرح أسئلة مفاهيمية.`;

const ASSESSMENT_BOUNDARY_PROMPT = `
## وضع الإرشاد التقييمي
يبدو أن الطالب يطلب إجابة مباشرة لتقييم.
- ارفض بلطف إعطاء الإجابة النهائية أو مفتاح الحل.
- قدّم تلميحات مفاهيمية وأسئلة توجيهية فقط.
- اقترح مراجعة محاضرات أو أهداف تعلم ذات صلة.
- لا تكشف الخيار الصحيح أو نص الحل.`;

const SESSION_CONTEXT_PROMPT = `
## ملاحظة
هذا السؤال يتعلق بالطالب أو تقدمه في الدورة.
- أجب باستخدام معلومات الطالب من سياق الجلسة (الاسم، التقدم، المستوى).
- لا تحتاج إلى مواد دورة مسترجعة للإجابة على هذا السؤال.`;

const RAG_FALLBACK_PROMPT = `
## ملاحظة مهمة
لم يتم العثور على مواد دورة مطابقة بدرجة كافية لهذا السؤال.
- وجّه الطالب نحو المحاضرات أو الأقسام ذات الصلة.
- لا تقدّم إجابات محددة كأنها من محتوى الدورة.
- اقترح على الطالب مراجعة المحاضرة الحالية أو المواد التعليمية ذات الصلة.`;

function formatObjectives(objectives: string[]): string {
  if (objectives.length === 0) {
    return 'غير محددة';
  }

  return objectives.map((objective) => `- ${objective}`).join('\n');
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function formatRetrievedChunks(chunks: RetrievedContentChunk[]): string {
  return chunks
    .map(
      (chunk, index) =>
        `### مصدر ${index + 1}: ${chunk.title} (ثقة: ${(chunk.score * 100).toFixed(0)}%)\n${chunk.content}`,
    )
    .join('\n\n');
}

export function buildSystemPrompt(
  sessionContext: TutorSessionContext,
  retrievedChunks: RetrievedContentChunk[] = [],
  options?: { assessmentMode?: boolean; sessionMetaMode?: boolean },
): string {
  const lines = [BASE_SYSTEM_PROMPT, '', '## سياق الجلسة'];

  if (options?.assessmentMode) {
    lines.push(ASSESSMENT_BOUNDARY_PROMPT);
  }

  lines.push('', '### معلومات الطالب');
  if (sessionContext.student.displayName) {
    lines.push(`- الاسم: ${sessionContext.student.displayName}`);
  } else {
    lines.push('- الاسم: غير متوفر في الملف الشخصي');
  }
  lines.push(`- مستوى التقدم في الدورة: ${sessionContext.student.learningLevel}`);

  lines.push(`- الدورة: ${sessionContext.course.title}`);
  lines.push(`- مستوى الدورة: ${formatCourseLevelLabel(sessionContext.course.level)}`);

  lines.push('', buildLevelAdaptiveInstructions(sessionContext));

  if (sessionContext.course.shortDescription) {
    lines.push(`- نبذة عن الدورة: ${sessionContext.course.shortDescription}`);
  }

  if (sessionContext.course.objectives.length > 0) {
    lines.push('', '### أهداف الدورة');
    lines.push(formatObjectives(sessionContext.course.objectives));
  }

  if (sessionContext.lecture) {
    lines.push('', '### المحاضرة الحالية');
    lines.push(`- العنوان: ${sessionContext.lecture.title}`);
    lines.push(`- القسم: ${sessionContext.lecture.sectionTitle}`);

    if (sessionContext.lecture.description) {
      lines.push(`- الوصف: ${sessionContext.lecture.description}`);
    }

    lines.push(
      `- حالة الإكمال: ${sessionContext.lecture.isCompleted ? 'مكتملة' : 'غير مكتملة'}`,
    );
  }

  lines.push('', '### تقدم الطالب');
  lines.push(
    `- نسبة الإكمال: ${sessionContext.studentProgress.completionPercentage}% (${sessionContext.studentProgress.completedLectures}/${sessionContext.studentProgress.totalLectures} محاضرة)`,
  );
  lines.push(`- حالة التسجيل: ${sessionContext.studentProgress.enrollmentStatus}`);

  if (sessionContext.lectureId) {
    lines.push(
      `- المحاضرة الحالية: ${sessionContext.studentProgress.currentLectureCompleted ? 'مكتملة' : 'قيد المتابعة'}`,
    );
  }

  lines.push('', '### تقدم الأقسام');
  lines.push(
    formatSectionProgressForPrompt(sessionContext.studentProgress.sectionProgress),
  );

  lines.push('', '### أداء التقييمات (بدون كشف الإجابات)');
  lines.push(
    formatAssessmentPerformanceSummary(
      sessionContext.studentProgress.assessmentPerformance,
    ),
  );

  if (sessionContext.studentProgress.knowledgeGaps.length > 0) {
    lines.push('', '### فجوات تعلم محتملة');
    lines.push(
      formatKnowledgeGapsForPrompt(sessionContext.studentProgress.knowledgeGaps),
    );
    lines.push(
      '- استخدم هذه الفجوات لتوجيه الطالب نحو المحتوى المناسب دون إعطاء إجابات التقييم.',
    );
  }

  const adaptiveInstructions = buildAdaptiveFormattingInstructions(
    sessionContext.learningProfile,
  );
  if (adaptiveInstructions) {
    lines.push('', adaptiveInstructions);
  }

  if (retrievedChunks.length > 0) {
    lines.push('', '## مواد الدورة ذات الصلة');
    lines.push(formatRetrievedChunks(retrievedChunks));
    lines.push(
      '',
      'عند الإجابة، اذكر المصدر بشكل طبيعي (مثل: "حسب محتوى المحاضرة...") عندما يكون ذلك مناسباً.',
    );
  } else if (options?.sessionMetaMode) {
    lines.push(SESSION_CONTEXT_PROMPT);
  } else {
    lines.push(RAG_FALLBACK_PROMPT);
  }

  return lines.join('\n');
}

export function trimConversationHistory(
  history: MessageDTO[],
  systemPrompt: string,
): MessageDTO[] {
  const maxPromptTokens = AI_TUTOR_CONSTANTS.MAX_PROMPT_TOKENS;
  const reservedResponseTokens = AI_TUTOR_CONSTANTS.MAX_RESPONSE_TOKENS;
  const systemTokens = estimateTokens(systemPrompt);
  const availableTokens = maxPromptTokens - systemTokens - reservedResponseTokens;

  if (availableTokens <= 0 || history.length === 0) {
    return history.slice(-2);
  }

  const trimmed: MessageDTO[] = [];
  let usedTokens = 0;

  for (let index = history.length - 1; index >= 0; index -= 1) {
    const message = history[index];
    if (!message) {
      continue;
    }

    const messageTokens = estimateTokens(message.content);

    if (usedTokens + messageTokens > availableTokens) {
      break;
    }

    trimmed.unshift(message);
    usedTokens += messageTokens;
  }

  return trimmed.length > 0 ? trimmed : history.slice(-2);
}

export function buildConversationMessages(
  history: MessageDTO[],
  sessionContext: TutorSessionContext,
  retrievedChunks: RetrievedContentChunk[] = [],
  options?: { assessmentMode?: boolean; sessionMetaMode?: boolean },
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const systemPrompt = buildSystemPrompt(
    sessionContext,
    retrievedChunks,
    options,
  );
  const trimmedHistory = trimConversationHistory(history, systemPrompt);

  return trimmedHistory.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

export function buildPromptPreview(
  sessionContext: TutorSessionContext,
  retrievedChunks: RetrievedContentChunk[] = [],
  options?: { assessmentMode?: boolean; sessionMetaMode?: boolean },
): {
  systemPrompt: string;
  estimatedSystemTokens: number;
} {
  const systemPrompt = buildSystemPrompt(
    sessionContext,
    retrievedChunks,
    options,
  );

  return {
    systemPrompt,
    estimatedSystemTokens: estimateTokens(systemPrompt),
  };
}
