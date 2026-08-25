import { AttachmentType } from '@/generated/prisma/enums';

import type {
  ExtractionResult,
  KnowledgeSource,
} from '@/ai-platform/indexing/domain/models/KnowledgeSource';
import type { TextExtractorPort } from '@/ai-platform/indexing/domain/ports/TextExtractorPort';
import { extractAttachmentText } from '@/ai-platform/indexing/services/attachment-content-extractor.service';
import { normalizeKnowledgeText } from '../text-normalizer.service';

export const codeExtractor: TextExtractorPort = {
  sourceType: 'code_example',

  canExtract(source: KnowledgeSource): boolean {
    return (
      source.sourceType === 'code_example' ||
      source.attachmentType === AttachmentType.CODE
    );
  },

  async extract(source: KnowledgeSource): Promise<ExtractionResult> {
    const attachmentId = String(
      source.metadata?.attachmentId ?? source.sourceId,
    );
    const result = await extractAttachmentText({
      id: attachmentId,
      name: source.title,
      type: AttachmentType.CODE,
      url: String(source.metadata?.url ?? ''),
      content: source.content,
      description: String(source.metadata?.description ?? ''),
      mimeType: String(source.metadata?.mimeType ?? ''),
    });

    if (!result.text) {
      return {
        source,
        skipped: true,
        skipReason: result.skipReason ?? 'empty_code_attachment',
      };
    }

    const normalized = normalizeKnowledgeText(result.text, {
      preserveMarkdown: true,
    });

    if (!normalized) {
      return { source, skipped: true, skipReason: 'empty_code_attachment' };
    }

    return {
      source,
      text: normalized,
      extractionMethod: result.extractionMethod ?? 'code',
    };
  },
};
