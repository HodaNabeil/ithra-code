import type {
  ExtractionResult,
  KnowledgeSource,
} from '../../../../domain/models/KnowledgeSource';
import type { TextExtractorPort } from '../../../../domain/ports/TextExtractorPort';
import { detectInstructorOnlyContent } from '../../assessment-content.service';
import { normalizeKnowledgeText } from '../text-normalizer.service';

export const instructorNotesExtractor: TextExtractorPort = {
  sourceType: 'instructor_notes',

  canExtract(source: KnowledgeSource): boolean {
    return source.sourceType === 'instructor_notes';
  },

  async extract(source: KnowledgeSource): Promise<ExtractionResult> {
    const normalized = normalizeKnowledgeText(source.content ?? '');
    if (!normalized) {
      return { source, skipped: true, skipReason: 'empty_instructor_notes' };
    }

    if (!detectInstructorOnlyContent(normalized)) {
      return {
        source,
        skipped: true,
        skipReason: 'not_instructor_content',
      };
    }

    return {
      source,
      text: normalized,
      extractionMethod: 'instructor_notes',
    };
  },
};
