const FOLLOW_UP_PATTERNS = [
  /^(ايه|إيه|اي|إي|هو|هي)\s+(المفاهيم|النقاط|المواضيع|الحاجات|الأفكار)/,
  /(قالها|قاله|ذكرها|ذكره|شرحها|شرحه|وضحها|وضحه)/,
  /(واللي|اللي)\s+(قال|ذكر|شرح|وضح)/,
  /\b(he|she|they|it)\s+(said|mentioned|explained|described)\b/i,
  /\bwhat\s+(concepts?|points?|topics?|ideas?)\b/i,
  /\b(the same|those|that|these)\b/i,
  /^(و|كمان|أيضاً|ايضا)\s/,
  /^(more|also|and)\b/i,
];

export type RetrievalHistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export function detectFollowUpQuestion(
  question: string,
  hasHistory: boolean,
): boolean {
  if (!hasHistory) {
    return false;
  }

  const trimmed = question.trim();
  if (!trimmed) {
    return false;
  }

  if (FOLLOW_UP_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return true;
  }

  const wordCount = trimmed.split(/\s+/).length;
  return (
    wordCount <= 5 &&
    /(ها\b|هي\b|دي\b|ده\b|دة\b|كده\b|same|those|that|these)/i.test(trimmed)
  );
}

export function buildRetrievalQuery(input: {
  question: string;
  recentHistory?: RetrievalHistoryMessage[];
  lectureTitle?: string;
  courseTitle?: string;
}): string {
  const question = input.question.trim();
  const hasHistory = (input.recentHistory?.length ?? 0) > 0;

  if (!detectFollowUpQuestion(question, hasHistory)) {
    return question;
  }

  const parts: string[] = [];

  if (input.lectureTitle) {
    parts.push(`محاضرة: ${input.lectureTitle}`);
  }

  if (input.courseTitle) {
    parts.push(`دورة: ${input.courseTitle}`);
  }

  for (const message of input.recentHistory?.slice(-4) ?? []) {
    const label = message.role === 'user' ? 'سؤال' : 'جواب';
    parts.push(`${label}: ${message.content}`);
  }

  parts.push(`سؤال متابعة: ${question}`);

  return parts.join('\n');
}
