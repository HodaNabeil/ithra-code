import { AttachmentType } from '@/generated/prisma/enums';

export type AttachmentExtractionInput = {
  id: string;
  name: string;
  type: AttachmentType;
  url: string;
  content?: string | null;
  description?: string | null;
  mimeType?: string | null;
};

export type AttachmentExtractionResult = {
  text: string | null;
  skipped: boolean;
  skipReason?: string;
  extractionMethod?: string;
};

const SKIP_TYPES = new Set<AttachmentType>([
  AttachmentType.IMAGE,
  AttachmentType.VIDEO,
  AttachmentType.AUDIO,
  AttachmentType.ZIP,
  AttachmentType.LINK,
]);

const TEXT_INLINE_TYPES = new Set<AttachmentType>([
  AttachmentType.TEXT,
  AttachmentType.CODE,
  AttachmentType.HTML,
]);

const OFFICE_TYPES = new Set<AttachmentType>([
  AttachmentType.DOC,
  AttachmentType.DOCX,
  AttachmentType.PPT,
  AttachmentType.PPTX,
  AttachmentType.XLS,
  AttachmentType.XLSX,
]);

const FETCH_TIMEOUT_MS = 20_000;
const MAX_PDF_BYTES = 12 * 1024 * 1024;

function normalizeInlineText(text?: string | null): string | null {
  if (!text?.trim()) {
    return null;
  }

  return text.replace(/\s+/g, ' ').trim();
}

function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

async function fetchBinary(url: string): Promise<Buffer | null> {
  if (!isHttpUrl(url)) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      return null;
    }

    const length = Number(response.headers.get('content-length') ?? 0);
    if (length > MAX_PDF_BYTES) {
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_PDF_BYTES) {
      return null;
    }

    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function extractPdfText(url: string): Promise<string | null> {
  const { PDFParse } = await import('pdf-parse');
  const buffer = await fetchBinary(url);
  if (!buffer) {
    return null;
  }

  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const text = result.text?.trim();
    return text && text.length > 0 ? text : null;
  } finally {
    await parser.destroy();
  }
}

export async function extractAttachmentText(
  input: AttachmentExtractionInput,
): Promise<AttachmentExtractionResult> {
  const inlineContent = normalizeInlineText(input.content);
  if (inlineContent) {
    return {
      text: inlineContent,
      skipped: false,
      extractionMethod: 'inline_content',
    };
  }

  const inlineDescription = normalizeInlineText(input.description);
  if (inlineDescription && !SKIP_TYPES.has(input.type)) {
    return {
      text: inlineDescription,
      skipped: false,
      extractionMethod: 'inline_description',
    };
  }

  if (SKIP_TYPES.has(input.type)) {
    return {
      text: null,
      skipped: true,
      skipReason: `unsupported_attachment_type:${input.type}`,
    };
  }

  if (TEXT_INLINE_TYPES.has(input.type)) {
    return {
      text: null,
      skipped: true,
      skipReason: 'empty_text_attachment',
    };
  }

  if (input.type === AttachmentType.PDF || input.mimeType === 'application/pdf') {
    try {
      const pdfText = await extractPdfText(input.url);
      if (pdfText) {
        return {
          text: pdfText,
          skipped: false,
          extractionMethod: 'pdf_parse',
        };
      }
    } catch (error) {
      console.warn('[ATTACHMENT_PDF_EXTRACT_FAILED]', {
        attachmentId: input.id,
        error,
      });
    }

    return {
      text: null,
      skipped: true,
      skipReason: 'pdf_extraction_failed',
    };
  }

  if (OFFICE_TYPES.has(input.type)) {
    return {
      text: null,
      skipped: true,
      skipReason: 'office_format_requires_inline_content',
    };
  }

  if (input.type === AttachmentType.OTHER) {
    return {
      text: null,
      skipped: true,
      skipReason: 'unsupported_attachment_type:OTHER',
    };
  }

  return {
    text: null,
    skipped: true,
    skipReason: `unsupported_attachment_type:${input.type}`,
  };
}
