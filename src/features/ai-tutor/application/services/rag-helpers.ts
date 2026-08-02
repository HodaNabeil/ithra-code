import type { RetrievedContentChunk } from '../dto/retrieved-content.dto';
import type { MessageSourceDTO } from '../../domain/models/MessageSource';
import { isLikelyEnglish } from '../../shared/language';
import type { SuggestableLecture } from './content-suggestion.service';
import { buildSuggestionFallback } from './content-suggestion.service';

const NO_RESULTS_MESSAGE_AR =
  'لم أجد معلومات عن هذا الموضوع في مواد الدورة الحالية، لذلك لا يمكنني تقديم شرح موثوق. يُرجى طرح سؤال آخر متعلق بمفاهيم مغطاة في هذه الدورة.';

const NO_RESULTS_MESSAGE_EN =
  "I couldn't find information about this topic in the current course materials, so I can't provide a reliable explanation. Please ask another question related to concepts covered in this course.";

export { isLikelyEnglish };

const NO_RESULTS_NOT_INDEXED_AR =
  'محتوى هذه الدورة قيد التحضير للمدرس الذكي. يُرجى المحاولة بعد قليل أو مراجعة المحاضرات المتاحة.';

const NO_RESULTS_NOT_INDEXED_EN =
  'This course content is still being prepared for the AI tutor. Please try again shortly or review the available lectures.';

export function buildNoResultsMessage(
  question: string,
  options?: {
    lectures?: SuggestableLecture[];
    excludeLectureId?: string;
    knowledgeIndexed?: boolean;
  },
): string {
  if (options?.knowledgeIndexed === false) {
    return isLikelyEnglish(question)
      ? NO_RESULTS_NOT_INDEXED_EN
      : NO_RESULTS_NOT_INDEXED_AR;
  }

  const base = isLikelyEnglish(question)
    ? NO_RESULTS_MESSAGE_EN
    : NO_RESULTS_MESSAGE_AR;

  if (!options?.lectures || options.lectures.length === 0) {
    return base;
  }

  const { formattedMessage } = buildSuggestionFallback(question, options.lectures, {
    excludeLectureId: options.excludeLectureId,
  });

  if (!formattedMessage) {
    return base;
  }

  return `${base}\n\n${formattedMessage}`;
}

export function mapChunksToSources(
  chunks: RetrievedContentChunk[],
): MessageSourceDTO[] {
  return chunks.map((chunk) => ({
    id: chunk.id,
    title: chunk.title,
    source: chunk.contentType,
    relevanceScore: chunk.score,
    contentType: chunk.contentType,
    lectureId: chunk.lectureId,
  }));
}

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

export type RetrievalHistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
};

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
