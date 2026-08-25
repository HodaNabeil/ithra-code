import { AttachmentType } from '@/generated/prisma/enums';

import type {
  ExtractionResult,
  KnowledgeSource,
} from '@/ai-platform/indexing/domain/models/KnowledgeSource';
import type { TextExtractorPort } from '@/ai-platform/indexing/domain/ports/TextExtractorPort';
import { extractAttachmentText } from '@/ai-platform/indexing/services/attachment-content-extractor.service';
import { normalizeKnowledgeText } from '../text-normalizer.service';

export const pdfExtractor: TextExtractorPort = {
  sourceType: 'pdf_document',

  canExtract(source: KnowledgeSource): boolean {
    return (
      source.sourceType === 'pdf_document' ||
      source.attachmentType === AttachmentType.PDF
    );
  },

  async extract(source: KnowledgeSource): Promise<ExtractionResult> {
    const attachmentId = String(
      source.metadata?.attachmentId ?? source.sourceId,
    );
    const result = await extractAttachmentText({
      id: attachmentId,
      name: source.title,
      type: AttachmentType.PDF,
      url: String(source.metadata?.url ?? ''),
      content: source.content,
      description: String(source.metadata?.description ?? ''),
      mimeType: String(source.metadata?.mimeType ?? 'application/pdf'),
    });

    if (!result.text) {
      return {
        source,
        skipped: true,
        skipReason: result.skipReason ?? 'pdf_extraction_failed',
      };
    }

    const normalized = normalizeKnowledgeText(result.text);
    if (!normalized) {
      return { source, skipped: true, skipReason: 'pdf_extraction_failed' };
    }

    return {
      source,
      text: normalized,
      extractionMethod: result.extractionMethod ?? 'pdf_parse',
    };
  },
};

export const textAttachmentExtractor: TextExtractorPort = {
  sourceType: 'text_attachment',

  canExtract(source: KnowledgeSource): boolean {
    return (
      source.sourceType === 'text_attachment' ||
      source.attachmentType === AttachmentType.TEXT ||
      source.attachmentType === AttachmentType.HTML
    );
  },

  async extract(source: KnowledgeSource): Promise<ExtractionResult> {
    const attachmentType = source.attachmentType ?? AttachmentType.TEXT;
    const attachmentId = String(
      source.metadata?.attachmentId ?? source.sourceId,
    );

    const result = await extractAttachmentText({
      id: attachmentId,
      name: source.title,
      type: attachmentType,
      url: String(source.metadata?.url ?? ''),
      content: source.content,
      description: String(source.metadata?.description ?? ''),
      mimeType: String(source.metadata?.mimeType ?? ''),
    });

    if (!result.text) {
      return {
        source,
        skipped: true,
        skipReason: result.skipReason ?? 'empty_text_attachment',
      };
    }

    const normalized = normalizeKnowledgeText(result.text, {
      preserveMarkdown: attachmentType === AttachmentType.TEXT,
    });

    if (!normalized) {
      return { source, skipped: true, skipReason: 'empty_text_attachment' };
    }

    return {
      source,
      text: normalized,
      extractionMethod: result.extractionMethod ?? 'text_attachment',
    };
  },
};
