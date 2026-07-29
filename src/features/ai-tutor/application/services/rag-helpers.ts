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

export function buildNoResultsMessage(
  question: string,
  options?: {
    lectures?: SuggestableLecture[];
    excludeLectureId?: string;
  },
): string {
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
