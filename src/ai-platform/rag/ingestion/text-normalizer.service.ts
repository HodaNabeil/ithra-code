import { createHash } from 'node:crypto';

const HTML_ENTITY_MAP: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
};

const UNSUPPORTED_CHAR_PATTERN =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

function decodeHtmlEntities(text: string): string {
  return text.replace(/&(?:nbsp|amp|lt|gt|quot|#39);/gi, (entity) => {
    return HTML_ENTITY_MAP[entity.toLowerCase()] ?? entity;
  });
}

function stripDangerousHtml(text: string): string {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
}

function preserveMarkdownStructure(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function preserveCodeBlocks(text: string): string {
  return text.replace(/```[\s\S]*?```/g, (block) => block.trim());
}

export function normalizeKnowledgeText(
  text: string,
  options: { preserveMarkdown?: boolean } = {},
): string | null {
  if (!text?.trim()) {
    return null;
  }

  let normalized = text.normalize('NFKC');
  normalized = decodeHtmlEntities(normalized);
  normalized = normalized.replace(UNSUPPORTED_CHAR_PATTERN, ' ');

  if (options.preserveMarkdown) {
    normalized = preserveMarkdownStructure(normalized);
    normalized = preserveCodeBlocks(normalized);
    normalized = normalized.replace(/[ \t]{2,}/g, ' ');
  } else if (/<[a-z][\s\S]*>/i.test(normalized)) {
    normalized = stripDangerousHtml(normalized);
    normalized = normalized.replace(/\s+/g, ' ').trim();
  } else {
    normalized = preserveMarkdownStructure(normalized);
    normalized = normalized.replace(/[ \t]{2,}/g, ' ');
  }

  return normalized.length > 0 ? normalized : null;
}

export function computeContentHash(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

export function detectContentFormat(
  text: string,
): 'markdown' | 'rich_text' | 'plain' {
  if (/^#{1,6}\s|```|\[[^\]]+\]\([^)]+\)|^\s*[-*+]\s/m.test(text)) {
    return 'markdown';
  }

  if (/<[a-z][\s\S]*>/i.test(text)) {
    return 'rich_text';
  }

  return 'plain';
}
