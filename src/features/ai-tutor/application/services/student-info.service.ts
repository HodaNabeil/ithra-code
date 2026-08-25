import type {
  StudentProgressInfo,
  TutorSessionContext,
} from '../../domain/models/TutorSessionContext';

export type StudentInfo = {
  displayName?: string;
  learningLevel: string;
  progressTier: StudentProgressTier;
};

export type StudentProgressTier =
  | 'start'
  | 'early'
  | 'mid'
  | 'advanced'
  | 'near_complete';

const COURSE_LEVEL_LABELS: Record<string, string> = {
  BEGINNER: 'مبتدئ',
  INTERMEDIATE: 'متوسط',
  ADVANCED: 'متقدم',
  ALL_LEVELS: 'جميع المستويات',
};

const COURSE_LEVEL_GUIDANCE: Record<string, string[]> = {
  BEGINNER: [
    '- استخدم لغة بسيطة وواضحة وعرّف المصطلحات التقنية عند أول استخدام.',
    '- ابدأ من الفكرة العامة ثم انتقل للتفاصيل خطوة بخطوة.',
    '- استخدم أمثلة من الحياة اليومية أو تشبيهات بسيطة.',
    '- لا تفترض معرفة مسبقة بمفاهيم متقدمة خارج نطاق الدورة.',
  ],
  INTERMEDIATE: [
    '- افترض أن الطالب يعرف الأساسيات ويمكنه متابعة شرح متوسط التعقيد.',
    '- استخدم المصطلحات التقنية مع توضيح مختصر عند الحاجة فقط.',
    '- اربط المفاهيم الجديدة بما سبق تعلمه في الدورة.',
    '- قدّم أمثلة عملية تطبيقية بعد الشرح النظري.',
  ],
  ADVANCED: [
    '- استخدم لغة تقنية دقيقة ويمكن التعمق في التفاصيل والحالات الحدية.',
    '- ركّز على أفضل الممارسات والمقارنات بين الحلول المختلفة.',
    '- اربط المفاهيم بسياقات تطبيقية واقعية ومتقدمة.',
    '- يمكن الإشارة لمواضيع ذات صلة خارج نطاق المحاضرة الحالية بإيجاز.',
  ],
  ALL_LEVELS: [
    '- قيّم مستوى الطالب من تقدمه في الدورة واضبط عمق الشرح بناءً عليه.',
    '- ابدأ بمستوى مناسب ثم زِد التعقيد حسب فهم الطالب.',
  ],
};

const STUDENT_PROGRESS_GUIDANCE: Record<StudentProgressTier, string[]> = {
  start: [
    '- الطالب في بداية الدورة: اشرح من الصفر ولا تقفز خطوات.',
    '- ركّز على المفاهيم الأساسية في المحاضرة الحالية فقط.',
    '- تحقق من الفهم بسؤال توجيهي بسيط في نهاية الإجابة.',
  ],
  early: [
    '- الطالب مبتدئ في الدورة: قدّم شرحاً مفصلاً مع أمثلة تدريجية.',
    '- اربط الإجابة بالمحتوى الذي شاهده بالفعل فقط.',
    '- عند ذكر مفهوم جديد، اربطه بما تعلمه سابقاً في الدورة.',
  ],
  mid: [
    '- الطالب في منتصف الدورة: يمكنك الافتراض بمعرفة أساسية جيدة.',
    '- اربط الإجابة بالمحاضرات والأقسام التي أكملها.',
    '- لخّص النقاط الرئيسية ثم تعمّق في التفاصيل المطلوبة.',
  ],
  advanced: [
    '- الطالب متقدم في الدورة: اختصر الأساسيات وركّز على التطبيق والربط بين المفاهيم.',
    '- يمكنك استخدام مصطلحات الدورة مباشرة دون شرح مفرط.',
    '- اقترح تطبيقات عملية أو أسئلة تحدي عند المناسب.',
  ],
  near_complete: [
    '- الطالب قارب على إكمال الدورة: ركّز على التركيب والتطبيق الشامل.',
    '- اربط المفاهيم عبر أقسام الدورة المختلفة.',
    '- ساعده على تثبيت المعرفة وربطها بسياقات أوسع.',
  ],
};

const SESSION_META_PATTERNS = [
  // Student identity and progress
  /\bmy\s+name\b/i,
  /\bwho\s+am\s+i\b/i,
  /\bremember\s+my\s+name\b/i,
  /\bdo\s+you\s+know\s+me\b/i,
  /\bmy\s+level\b/i,
  /\bmy\s+progress\b/i,
  /\bhow\s+am\s+i\s+doing\b/i,
  /اسمي/,
  /اسمك/,
  /فاكر\s+اسم/,
  /تتذكر\s+اسم/,
  /تعرفني/,
  /مين\s+أنا/,
  /من\s+أنا/,
  /مستواي/,
  /مستوى\s+تقدمي/,
  /تقدمي/,
  /وين\s+وصلت/,
  /كم\s+أنجزت/,
  /كيف\s+تقدمي/,
  /نسبة\s+إكمالي/,
  // Current lecture / course context
  /اسم\s+(الدرس|المحاضرة|الدورة)/,
  /عنوان\s+(الدرس|المحاضرة)/,
  /(الدرس|المحاضرة|الدورة)\s+(ايه|إيه|اي|إي|هو|هي)/,
  /(ايه|إيه|اي|إي)\s+(الدرس|المحاضرة|الدورة)/,
  /(ماذا|ما)\s+(أدرس|ادرس|نتعلم|ندرس)/,
  /(بدرس|أدرس|ادرس)\s+(ايه|إيه|اي|إي|ماذا)/,
  /في\s+أي\s+(محاضرة|درس|قسم)/,
  /أي\s+(محاضرة|درس)\s+(هذه|دي|دا)/,
  /\b(current|this)\s+(lecture|lesson|course)\b/i,
  /\b(lecture|lesson|course)\s+name\b/i,
  /\bwhat\s+(lecture|lesson|course)\b/i,
  /\bwhat\s+am\s+i\s+(studying|learning)\b/i,
];

export function resolveStudentDisplayName(student: {
  name: string | null;
  firstName: string | null;
  lastName: string | null;
}): string | undefined {
  const fromParts = [student.firstName, student.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  if (fromParts) {
    return fromParts;
  }

  const fromName = student.name?.trim();
  return fromName || undefined;
}

export function formatCourseLevelLabel(level: string): string {
  return COURSE_LEVEL_LABELS[level] ?? level;
}

export function deriveStudentProgressTier(
  completionPercentage: number,
): StudentProgressTier {
  if (completionPercentage < 15) {
    return 'start';
  }

  if (completionPercentage < 40) {
    return 'early';
  }

  if (completionPercentage < 70) {
    return 'mid';
  }

  if (completionPercentage < 90) {
    return 'advanced';
  }

  return 'near_complete';
}

export function deriveStudentLearningLevel(
  progress: Pick<StudentProgressInfo, 'completionPercentage' | 'knowledgeGaps'>,
): string {
  const { completionPercentage, knowledgeGaps } = progress;
  const tier = deriveStudentProgressTier(completionPercentage);

  const tierLabels: Record<StudentProgressTier, string> = {
    start: 'في بداية الدورة',
    early: 'مبتدئ في الدورة',
    mid:
      knowledgeGaps.length > 0
        ? 'في مرحلة متوسطة مع بعض الفجوات التعليمية'
        : 'في مرحلة متوسطة',
    advanced: 'متقدم في الدورة',
    near_complete: 'قارب على إكمال الدورة',
  };

  return tierLabels[tier];
}

export function buildStudentInfo(params: {
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  progress: StudentProgressInfo;
}): StudentInfo {
  const progressTier = deriveStudentProgressTier(
    params.progress.completionPercentage,
  );

  return {
    displayName: resolveStudentDisplayName(params),
    learningLevel: deriveStudentLearningLevel(params.progress),
    progressTier,
  };
}

export function buildLevelAdaptiveInstructions(
  sessionContext: TutorSessionContext,
): string {
  const courseLevel = sessionContext.course.level;
  const courseLevelLabel = formatCourseLevelLabel(courseLevel);
  const progressTier = sessionContext.student.progressTier;
  const { completionPercentage, knowledgeGaps } =
    sessionContext.studentProgress;
  const studentName = sessionContext.student.displayName;

  const lines = [
    '## تكييف الشرح حسب المستوى',
    `- مستوى الدورة: ${courseLevelLabel}`,
    `- مستوى الطالب في الدورة: ${sessionContext.student.learningLevel}`,
    `- نسبة إكمال الدورة: ${completionPercentage}%`,
    '',
    '### إرشادات مستوى الدورة',
    ...(COURSE_LEVEL_GUIDANCE[courseLevel] ??
      COURSE_LEVEL_GUIDANCE.ALL_LEVELS!),
    '',
    '### إرشادات حسب تقدم الطالب',
    ...STUDENT_PROGRESS_GUIDANCE[progressTier],
  ];

  if (knowledgeGaps.length > 0) {
    lines.push(
      '',
      '### ملاحظة عن الفجوات التعليمية',
      '- لدى الطالب فجوات في بعض المحاضرات: بسّط الشرح واربطه بالأساسيات عند الحاجة.',
      '- لا تفترض إتقاناً كاملاً للمواضيع التي لم يكملها بعد.',
    );
  }

  lines.push(
    '',
    '### أسلوب الرد',
    '- كيّف عمق الشرح وطول الإجابة بناءً على مستوى الدورة وتقدم الطالب معاً.',
    '- إذا كان مستوى الدورة متقدماً والطالب في البداية: اشرح بلغة الدورة لكن بخطوات أبطأ وأمثلة أوضح.',
    '- إذا كان مستوى الدورة مبتدئاً والطالب متقدماً: يمكنك الإيجاز والتركيز على التطبيق.',
  );

  if (studentName) {
    lines.push(
      `- خاطب الطالب باسمه (${studentName}) عند المناسب لجعل التجربة شخصية.`,
    );
  }

  return lines.join('\n');
}

export type SessionMetaIntent = {
  isSessionMeta: boolean;
  confidence: number;
};

export function detectSessionMetaIntent(question: string): SessionMetaIntent {
  const trimmed = question.trim();
  if (!trimmed) {
    return { isSessionMeta: false, confidence: 0 };
  }

  const matches = SESSION_META_PATTERNS.filter((pattern) =>
    pattern.test(trimmed),
  ).length;
  if (matches === 0) {
    return { isSessionMeta: false, confidence: 0 };
  }

  return {
    isSessionMeta: true,
    confidence: Math.min(1, 0.5 + matches * 0.25),
  };
}
