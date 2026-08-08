import type { ResponseEnricherPort } from '@/ai-platform/domain/ports/response-enricher.port';
import {
  buildSuggestionFallback,
  type SuggestableLecture,
} from '../../application/services/content-suggestion.service';

function isSuggestableLecture(value: unknown): value is SuggestableLecture {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as SuggestableLecture).id === 'string' &&
    typeof (value as SuggestableLecture).title === 'string' &&
    typeof (value as SuggestableLecture).sectionTitle === 'string'
  );
}

/**
 * Appends lecture suggestions after assessment-blocked guided responses.
 */
export class TutorResponseEnricherAdapter implements ResponseEnricherPort {
  async enrich(
    response: string,
    context: { question?: string; metadata?: Record<string, unknown> },
  ): Promise<string> {
    const metadata = context.metadata ?? {};
    const lectures = Array.isArray(metadata.lectureCatalog)
      ? metadata.lectureCatalog.filter(isSuggestableLecture)
      : [];
    const excludeLectureId =
      typeof metadata.lectureId === 'string' ? metadata.lectureId : undefined;
    const question = context.question ?? '';

    const { formattedMessage } = buildSuggestionFallback(question, lectures, {
      excludeLectureId,
    });

    if (!formattedMessage) {
      return response;
    }

    return `${response}\n\n${formattedMessage}`;
  }
}

export const tutorResponseEnricherAdapter = new TutorResponseEnricherAdapter();
