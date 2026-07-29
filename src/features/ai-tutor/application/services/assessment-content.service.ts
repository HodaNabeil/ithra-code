import { LectureType } from '@/generated/prisma/enums';

const INSTRUCTOR_ONLY_PATTERNS = [
  /\banswer\s*key\b/i,
  /\bcorrect\s*answer\b/i,
  /\bsolution\s*key\b/i,
  /\bmodel\s*answer\b/i,
  /\bgrading\s*rubric\b/i,
  /مفتاح\s*الإجابة/,
  /الإجابة\s*الصحيحة/,
  /نموذج\s*الإجابة/,
];

const HINT_SECTION_PATTERNS = [
  /\blearning objectives?\b/i,
  /\bobjectives?\b:/i,
  /\binstructions?\b:/i,
  /\bwhat you will learn\b/i,
  /أهداف\s*التعلم/,
  /الأهداف\s*:/,
  /تعليمات\s*الواجب/,
  /تعليمات\s*الاختبار/,
];

const ANSWER_LINE_PATTERNS = [
  /^\s*(?:correct|answer|solution)\s*[:：]/i,
  /^\s*(?:الإجابة|الحل)\s*[:：]/,
  /^\s*[A-D]\)\s*.*\(\s*correct\s*\)/i,
];

export function detectInstructorOnlyContent(text: string): boolean {
  return INSTRUCTOR_ONLY_PATTERNS.some((pattern) => pattern.test(text));
}

export function extractAssessmentHints(text: string): string | null {
  const lines = text.split('\n');
  const hintLines: string[] = [];
  let inHintSection = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    if (HINT_SECTION_PATTERNS.some((pattern) => pattern.test(trimmed))) {
      inHintSection = true;
      hintLines.push(trimmed);
      continue;
    }

    if (
      ANSWER_LINE_PATTERNS.some((pattern) => pattern.test(trimmed)) ||
      /^\s*question\s*\d+/i.test(trimmed) ||
      /^\s*سؤال\s*\d+/i.test(trimmed)
    ) {
      inHintSection = false;
      continue;
    }

    if (inHintSection) {
      hintLines.push(trimmed);
    }
  }

  const hints = hintLines.join('\n').trim();
  return hints.length > 0 ? hints : null;
}

export function sanitizeAssessmentBody(text: string): string {
  const sanitizedLines = text
    .split('\n')
    .filter((line) => !ANSWER_LINE_PATTERNS.some((pattern) => pattern.test(line)))
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return sanitizedLines.join('\n').trim();
}

export function buildAssessmentReferenceMetadata(params: {
  lectureType: LectureType;
  lectureId: string;
  hasHints: boolean;
}): Record<string, unknown> {
  return {
    assessmentReference: {
      lectureId: params.lectureId,
      assessmentType:
        params.lectureType === LectureType.QUIZ ? 'quiz' : 'assignment',
      canBeUsedAsHint: params.hasHints,
      isAnswer: false,
    },
  };
}
