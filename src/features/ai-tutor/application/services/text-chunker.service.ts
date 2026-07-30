import { AI_TUTOR_CONSTANTS } from '../../shared';

export type TextChunk = {
  content: string;
  chunkIndex: number;
  tokenCount: number;
  totalChunks?: number;
};

export type ContentChunkKind =
  | 'default'
  | 'transcript'
  | 'code'
  | 'pdf'
  | 'assessment'
  | 'markdown';

type ChunkOptions = {
  maxChars?: number;
  overlapChars?: number;
  minChars?: number;
  maxTokens?: number;
};

function getDefaultChunkOptions(): Required<ChunkOptions> {
  return {
    maxChars: AI_TUTOR_CONSTANTS.INDEXING_CHUNK_MAX_CHARS,
    overlapChars: AI_TUTOR_CONSTANTS.INDEXING_CHUNK_OVERLAP_CHARS,
    minChars: AI_TUTOR_CONSTANTS.INDEXING_CHUNK_MIN_CHARS,
    maxTokens: AI_TUTOR_CONSTANTS.INDEXING_MAX_TOKENS_PER_CHUNK,
  };
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?؟。])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

function splitMarkdownSections(text: string): string[] {
  const sections: string[] = [];
  const fencedCodePattern = /```[\s\S]*?```/g;
  const placeholders: string[] = [];

  const protectedText = text.replace(fencedCodePattern, (block) => {
    placeholders.push(block);
    return `__CODE_BLOCK_${placeholders.length - 1}__`;
  });

  const headingSections = protectedText.split(/(?=^#{1,6}\s)/m);
  for (const section of headingSections) {
    const trimmed = section.trim();
    if (!trimmed) {
      continue;
    }

    if (trimmed.length <= (getDefaultChunkOptions().maxChars ?? 1000)) {
      sections.push(restoreCodeBlocks(trimmed, placeholders));
      continue;
    }

    const paragraphs = splitIntoParagraphs(trimmed);
    for (const paragraph of paragraphs) {
      sections.push(restoreCodeBlocks(paragraph, placeholders));
    }
  }

  return sections.filter((section) => section.length > 0);
}

function restoreCodeBlocks(text: string, placeholders: string[]): string {
  return text.replace(/__CODE_BLOCK_(\d+)__/g, (_, index) => {
    return placeholders[Number(index)] ?? '';
  });
}

function splitCodeBlocks(text: string): string[] {
  const fencedBlocks = text.match(/```[\s\S]*?```/g);
  if (fencedBlocks && fencedBlocks.length > 0) {
    return fencedBlocks.map((block) => block.trim());
  }

  const blocks = text.split(
    /(?=^(?:function|class|export|const|let|var|def|import)\s)/m,
  );
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

function finalizeChunks(chunks: TextChunk[]): TextChunk[] {
  const totalChunks = chunks.length;
  return chunks.map((chunk, index) => ({
    ...chunk,
    chunkIndex: index,
    totalChunks,
  }));
}

function chunkBySegments(
  segments: string[],
  options: ChunkOptions,
  joiner: string,
): TextChunk[] {
  const defaults = getDefaultChunkOptions();
  const maxChars = options.maxChars ?? defaults.maxChars;
  const overlapChars = options.overlapChars ?? defaults.overlapChars;
  const minChars = options.minChars ?? defaults.minChars;
  const maxTokens = options.maxTokens ?? defaults.maxTokens;

  const chunks: TextChunk[] = [];
  let current = '';
  let chunkIndex = 0;

  const pushChunk = (content: string) => {
    const trimmed = content.trim();
    if (trimmed.length < minChars) {
      return;
    }

    const tokenCount = estimateTokens(trimmed);
    if (tokenCount > maxTokens) {
      const sentenceChunks = chunkBySegments(
        splitIntoSentences(trimmed),
        { ...options, minChars: Math.min(minChars, 40) },
        ' ',
      );
      chunks.push(...sentenceChunks);
      return;
    }

    chunks.push({
      content: trimmed,
      chunkIndex,
      tokenCount,
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

  return finalizeChunks(chunks);
}

export function chunkText(
  text: string,
  options?: ChunkOptions,
): TextChunk[] {
  const normalized = text.trim();
  if (!normalized) {
    return [];
  }

  const defaults = getDefaultChunkOptions();
  const maxChars = options?.maxChars ?? defaults.maxChars;

  if (normalized.length <= maxChars) {
    return finalizeChunks([
      {
        content: normalized,
        chunkIndex: 0,
        tokenCount: estimateTokens(normalized),
      },
    ]);
  }

  return chunkBySegments(splitIntoParagraphs(text), options ?? {}, '\n\n');
}

export function chunkMarkdownContent(
  text: string,
  options?: ChunkOptions,
): TextChunk[] {
  const defaults = getDefaultChunkOptions();
  const maxChars = options?.maxChars ?? defaults.maxChars;
  const trimmed = text.trim();

  if (!trimmed) {
    return [];
  }

  if (trimmed.length <= maxChars) {
    return finalizeChunks([
      {
        content: trimmed,
        chunkIndex: 0,
        tokenCount: estimateTokens(trimmed),
      },
    ]);
  }

  const sections = splitMarkdownSections(text);
  if (sections.length === 0) {
    return chunkText(text, options);
  }

  return chunkBySegments(sections, options ?? {}, '\n\n');
}

export function chunkContentByKind(
  text: string,
  kind: ContentChunkKind,
  options?: ChunkOptions,
): TextChunk[] {
  const defaults = getDefaultChunkOptions();

  switch (kind) {
    case 'markdown':
      return chunkMarkdownContent(text, options);

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

    case 'code': {
      const codeBlocks = splitCodeBlocks(text);
      if (codeBlocks.length > 1) {
        return chunkBySegments(
          codeBlocks,
          {
            maxChars: 1200,
            overlapChars: 0,
            minChars: 40,
            ...options,
          },
          '\n\n',
        );
      }
      return chunkText(text, {
        maxChars: 1200,
        overlapChars: 0,
        minChars: 40,
        ...options,
      });
    }

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
      return chunkText(text, {
        ...defaults,
        ...options,
      });
  }
}
