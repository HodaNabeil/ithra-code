import type {
  ExtractionResult,
  KnowledgeSource,
} from '@/ai-platform/indexing/domain/models/KnowledgeSource';
import type { TextExtractorPort } from '@/ai-platform/indexing/domain/ports/TextExtractorPort';
import { AI_PLATFORM_CONSTANTS } from '@/ai-platform/shared/constants';
import { normalizeKnowledgeText } from '../text-normalizer.service';

export const transcriptExtractor: TextExtractorPort = {
  sourceType: 'video_transcript',

  canExtract(source: KnowledgeSource): boolean {
    return source.sourceType === 'video_transcript';
  },

  async extract(source: KnowledgeSource): Promise<ExtractionResult> {
    const normalized = normalizeKnowledgeText(source.content ?? '', {
      preserveMarkdown: false,
    });

    if (!normalized) {
      return { source, skipped: true, skipReason: 'empty_transcript' };
    }

    if (
      normalized.length > AI_PLATFORM_CONSTANTS.INDEXING_MAX_TRANSCRIPT_CHARS
    ) {
      return {
        source,
        skipped: true,
        skipReason: 'transcript_too_long',
      };
    }

    return {
      source,
      text: normalized,
      extractionMethod: 'transcript',
    };
  },
};
