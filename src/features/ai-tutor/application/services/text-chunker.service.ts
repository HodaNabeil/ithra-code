import { AI_TUTOR_CONSTANTS } from '../../shared';

export type TextChunk = {
  content: string;
  chunkIndex: number;
  tokenCount: number;
};

export type ContentChunkKind =
  | 'default'
  | 'transcript'
  | 'code'
  | 'pdf'
  | 'assessment';

type ChunkOptions = {
  maxChars?: number;
  overlapChars?: number;
  minChars?: number;
};

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => normalizeWhitespace(paragraph))
    .filter((paragraph) => paragraph.length > 0);
}

function splitCodeBlocks(text: string): string[] {
  const blocks = text.split(/(?=^(?:function|class|export|const|let|var|def|import)\s)/m);
  return blocks
    .map((block) => block.trim())
    .filter((block) => block.length > 0);
}

function splitTranscriptSegments(text: string): string[] {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function chunkBySegments(
  segments: string[],
  options: ChunkOptions,
  joiner: string,
): TextChunk[] {
  const maxChars = options.maxChars ?? AI_TUTOR_CONSTANTS.CHUNK_MAX_CHARS;
  const overlapChars = options.overlapChars ?? AI_TUTOR_CONSTANTS.CHUNK_OVERLAP_CHARS;
  const minChars = options.minChars ?? AI_TUTOR_CONSTANTS.CHUNK_MIN_CHARS;

  const chunks: TextChunk[] = [];
  let current = '';
  let chunkIndex = 0;

  const pushChunk = (content: string) => {
    const trimmed = normalizeWhitespace(content);
    if (trimmed.length < minChars) {
      return;
    }

    chunks.push({
      content: trimmed,
      chunkIndex,
      tokenCount: estimateTokens(trimmed),
    });
    chunkIndex += 1;
  };

  for (const segment of segments) {
    const candidate = current ? `${current}${joiner}${segment}` : segment;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    if (current) {
      pushChunk(current);
      const overlap = current.slice(-overlapChars);
      current = overlap ? `${overlap}${joiner}${segment}` : segment;
      continue;
    }

    if (segment.length <= maxChars) {
      current = segment;
      continue;
    }

    let start = 0;
    while (start < segment.length) {
      const end = Math.min(start + maxChars, segment.length);
      pushChunk(segment.slice(start, end));
      if (end >= segment.length) {
        break;
      }
      start = Math.max(end - overlapChars, start + 1);
    }
    current = '';
  }

  if (current) {
    pushChunk(current);
  }

  return chunks.map((chunk, index) => ({
    ...chunk,
    chunkIndex: index,
  }));
}

export function chunkText(
  text: string,
  options?: ChunkOptions,
): TextChunk[] {
  const normalized = normalizeWhitespace(text);
  if (!normalized) {
    return [];
  }

  const maxChars = options?.maxChars ?? AI_TUTOR_CONSTANTS.CHUNK_MAX_CHARS;

  if (normalized.length <= maxChars) {
    return [
      {
        content: normalized,
        chunkIndex: 0,
        tokenCount: estimateTokens(normalized),
      },
    ];
  }

  return chunkBySegments(splitIntoParagraphs(text), options ?? {}, '\n\n');
}

export function chunkContentByKind(
  text: string,
  kind: ContentChunkKind,
  options?: ChunkOptions,
): TextChunk[] {
  switch (kind) {
    case 'transcript':
      return chunkBySegments(
        splitTranscriptSegments(text),
        {
          maxChars: 1500,
          overlapChars: 200,
          minChars: 80,
          ...options,
        },
        ' ',
      );

    case 'code':
      const codeBlocks = splitCodeBlocks(text);
      if (codeBlocks.length > 1) {
        return chunkBySegments(codeBlocks, {
          maxChars: 1200,
          overlapChars: 0,
          minChars: 40,
          ...options,
        }, '\n\n');
      }
      return chunkText(text, {
        maxChars: 1200,
        overlapChars: 0,
        minChars: 40,
        ...options,
      });

    case 'pdf':
      return chunkBySegments(
        text.split(/\n{2,}|(?=^\s*[A-Z0-9\u0600-\u06FF].{0,80}$)/m),
        {
          maxChars: 1100,
          overlapChars: 120,
          minChars: 80,
          ...options,
        },
        '\n\n',
      );

    case 'assessment':
      return chunkText(text, {
        maxChars: 600,
        overlapChars: 60,
        minChars: 40,
        ...options,
      });

    default:
      return chunkText(text, options);
  }
}
