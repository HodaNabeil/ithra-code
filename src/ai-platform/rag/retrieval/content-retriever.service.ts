import type { EmbeddingPort, VectorSearchPort } from '../../domain/ports';
import { AIPlatformConfig } from '../../infrastructure/config/ai-platform.config';
import { getCachedEmbedding, setCachedEmbedding } from '../../embeddings/cache/embedding-cache';
import { withSpan } from '../../observability/opentelemetry/span-helpers';
import { platformMetrics } from '../../observability/metrics/platform-metrics';
import {
  buildRetrievalQuery,
  type RetrievalHistoryMessage,
} from './retrieval-query';
import type {
  ContentRetrievalResult,
  RetrievedContentChunk,
  RetrievalStrategy,
} from './types';

export type RetrieveRelevantContentInput = {
  question: string;
  courseId: string;
  lectureId?: string;
  lectureTitle?: string;
  courseTitle?: string;
  recentHistory?: RetrievalHistoryMessage[];
};

export type VectorSearchConfig = {
  topK: number;
  minScore: number;
  lectureFallbackMinSimilarity: number;
};

export type ContentRetrieverDeps = {
  embeddingPort: EmbeddingPort;
  vectorSearchPort: VectorSearchPort;
  vectorSearchConfig?: VectorSearchConfig;
};

function resolveSearchConfig(deps: ContentRetrieverDeps): VectorSearchConfig {
  if (deps.vectorSearchConfig) {
    return deps.vectorSearchConfig;
  }

  const config = AIPlatformConfig.getRetrievalConfig();
  return {
    topK: config.topK,
    minScore: config.minSimilarity,
    lectureFallbackMinSimilarity: config.lectureFallbackMinSimilarity,
  };
}

function mapSearchResults(
  results: Awaited<ReturnType<VectorSearchPort['search']>>,
): RetrievedContentChunk[] {
  return results.map((result) => ({
    id: result.id,
    title: String(result.metadata.title ?? 'مصدر غير معروف'),
    content: result.content,
    score: result.score,
    lectureId:
      typeof result.metadata.lectureId === 'string'
        ? result.metadata.lectureId
        : undefined,
    contentType: String(result.metadata.contentType ?? 'UNKNOWN'),
    metadata: result.metadata,
  }));
}

async function embedQuery(
  query: string,
  embeddingPort: EmbeddingPort,
): Promise<{ embedding: number[]; tokensUsed: number }> {
  const cached = await getCachedEmbedding(query);
  if (cached) {
    return { embedding: cached, tokensUsed: 0 };
  }

  const result = await embeddingPort.generateEmbedding(query);
  await setCachedEmbedding(query, result.embedding);
  return {
    embedding: result.embedding,
    tokensUsed: result.tokensUsed ?? 0,
  };
}

async function searchChunks(
  query: string,
  input: Pick<RetrieveRelevantContentInput, 'courseId' | 'lectureId'>,
  deps: ContentRetrieverDeps,
  minScore: number,
): Promise<{ chunks: RetrievedContentChunk[]; embeddingTokensUsed: number }> {
  const searchConfig = resolveSearchConfig(deps);

  const { embedding, tokensUsed } = await embedQuery(query, deps.embeddingPort);
  const results = await deps.vectorSearchPort.search(embedding, {
    topK: searchConfig.topK,
    minScore,
    filter: {
      courseId: input.courseId,
      lectureId: input.lectureId,
    },
  });

  return {
    chunks: mapSearchResults(results),
    embeddingTokensUsed: tokensUsed,
  };
}

function buildSuccessResult(
  chunks: RetrievedContentChunk[],
  strategy: RetrievalStrategy,
  embeddingTokensUsed: number,
): ContentRetrievalResult {
  const usedFallback = strategy === 'lecture-relaxed' || strategy === 'none';
  return {
    chunks,
    hasResults: chunks.length > 0,
    usedFallback,
    retrievalStrategy: strategy,
    embeddingTokensUsed,
  };
}

export async function retrieveRelevantContent(
  input: RetrieveRelevantContentInput,
  deps: ContentRetrieverDeps,
): Promise<ContentRetrievalResult> {
  const startedAt = Date.now();
  return withSpan(
    'ai.rag.retrieve',
    { 'ai.course.id': input.courseId, 'ai.lecture.id': input.lectureId ?? 'none' },
    async () => {
      const result = await retrieveRelevantContentInternal(input, deps);
      platformMetrics.incrementRetrieval('tutor', result.chunks.length);
      platformMetrics.recordRetrievalLatency('tutor', Date.now() - startedAt);
      return result;
    },
  );
}

async function retrieveRelevantContentInternal(
  input: RetrieveRelevantContentInput,
  deps: ContentRetrieverDeps,
): Promise<ContentRetrievalResult> {
  const question = input.question.trim();
  if (!question) {
    return {
      chunks: [],
      hasResults: false,
      usedFallback: true,
      retrievalStrategy: 'none',
      embeddingTokensUsed: 0,
    };
  }

  const searchConfig = resolveSearchConfig(deps);

  let embeddingTokensUsed = 0;

  let searchResult = await searchChunks(question, input, deps, searchConfig.minScore);
  embeddingTokensUsed += searchResult.embeddingTokensUsed;
  let chunks = searchResult.chunks;
  if (chunks.length > 0) {
    return buildSuccessResult(chunks, 'strict', embeddingTokensUsed);
  }

  const expandedQuery = buildRetrievalQuery({
    question,
    recentHistory: input.recentHistory,
    lectureTitle: input.lectureTitle,
    courseTitle: input.courseTitle,
  });

  if (expandedQuery !== question) {
    searchResult = await searchChunks(expandedQuery, input, deps, searchConfig.minScore);
    embeddingTokensUsed += searchResult.embeddingTokensUsed;
    chunks = searchResult.chunks;
    if (chunks.length > 0) {
      return buildSuccessResult(chunks, 'expanded', embeddingTokensUsed);
    }
  }

  if (input.lectureId) {
    const fallbackQuery = expandedQuery !== question ? expandedQuery : question;
    searchResult = await searchChunks(
      fallbackQuery,
      input,
      deps,
      searchConfig.lectureFallbackMinSimilarity,
    );
    embeddingTokensUsed += searchResult.embeddingTokensUsed;
    chunks = searchResult.chunks;
    if (chunks.length > 0) {
      return buildSuccessResult(chunks, 'lecture-relaxed', embeddingTokensUsed);
    }
  }

  return {
    chunks: [],
    hasResults: false,
    usedFallback: true,
    retrievalStrategy: 'none',
    embeddingTokensUsed,
  };
}
