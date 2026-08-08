import type {
  ExtractionResult,
  KnowledgeSource,
} from '@/ai-platform/indexing/domain/models/KnowledgeSource';
import type { TextExtractorPort } from '@/ai-platform/indexing/domain/ports/TextExtractorPort';
import {
  detectContentFormat,
  normalizeKnowledgeText,
} from '../text-normalizer.service';

export function createInlineTextExtractor(params: {
  sourceType: TextExtractorPort['sourceType'];
  canExtract: (source: KnowledgeSource) => boolean;
  preserveMarkdown?: boolean;
  extractionMethod?: string;
  sanitizeText?: (text: string) => string;
}): TextExtractorPort {
  return {
    sourceType: params.sourceType,
    canExtract: params.canExtract,
    async extract(source: KnowledgeSource): Promise<ExtractionResult> {
      const normalized = normalizeKnowledgeText(source.content ?? '', {
        preserveMarkdown: params.preserveMarkdown,
      });

      if (!normalized) {
        return {
          source,
          skipped: true,
          skipReason: 'empty_content',
        };
      }

      const text = params.sanitizeText
        ? params.sanitizeText(normalized)
        : normalized;

      if (!text.trim()) {
        return {
          source,
          skipped: true,
          skipReason: 'empty_content',
        };
      }

      return {
        source,
        text,
        extractionMethod: params.extractionMethod ?? 'inline_text',
      };
    },
  };
}

export function resolveLectureContentSourceType(
  content: string,
): 'markdown_content' | 'rich_text_content' {
  const format = detectContentFormat(content);
  if (format === 'markdown') {
    return 'markdown_content';
  }

  if (format === 'rich_text') {
    return 'rich_text_content';
  }

  return 'markdown_content';
}
