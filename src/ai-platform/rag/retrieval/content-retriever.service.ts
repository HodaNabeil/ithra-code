import type { EmbeddingPort, VectorSearchPort } from '../../domain/ports';
import { getCachedEmbedding, setCachedEmbedding } from '../../embeddings/cache/embedding-cache';
import { withSpan } from '../../observability/opentelemetry/span-helpers';
import { platformMetrics } from '../../observability/metrics/platform-metrics';
import { AI_PLATFORM_CONSTANTS } from '../../shared/constants';
import {
  buildRetrievalQuery,
  type RetrievalHistoryMessage,
} from './retrieval-query';
import type { ContentRetrievalResult, RetrievedContentChunk } from './types';

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
};

export type ContentRetrieverDeps = {
  embeddingPort: EmbeddingPort;
  vectorSearchPort: VectorSearchPort;
  vectorSearchConfig?: VectorSearchConfig;
};

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
): Promise<number[]> {
  const cached = await getCachedEmbedding(query);
  if (cached) {
    return cached;
  }

  const result = await embeddingPort.generateEmbedding(query);
  await setCachedEmbedding(query, result.embedding);
  return result.embedding;
}

async function searchChunks(
  query: string,
  input: Pick<RetrieveRelevantContentInput, 'courseId' | 'lectureId'>,
  deps: ContentRetrieverDeps,
  minScore: number,
): Promise<RetrievedContentChunk[]> {
  const searchConfig = deps.vectorSearchConfig ?? {
    topK: AI_PLATFORM_CONSTANTS.DEFAULT_TOP_K,
    minScore: AI_PLATFORM_CONSTANTS.DEFAULT_MIN_SIMILARITY,
  };

  const embedding = await embedQuery(query, deps.embeddingPort);
  const results = await deps.vectorSearchPort.search(embedding, {
    topK: searchConfig.topK,
    minScore,
    filter: {
      courseId: input.courseId,
      lectureId: input.lectureId,
    },
  });

  return mapSearchResults(results);
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
    return { chunks: [], hasResults: false, usedFallback: true };
  }

  const searchConfig = deps.vectorSearchConfig ?? {
    topK: AI_PLATFORM_CONSTANTS.DEFAULT_TOP_K,
    minScore: AI_PLATFORM_CONSTANTS.DEFAULT_MIN_SIMILARITY,
  };

  let chunks = await searchChunks(question, input, deps, searchConfig.minScore);
  if (chunks.length > 0) {
    return { chunks, hasResults: true, usedFallback: false };
  }

  const expandedQuery = buildRetrievalQuery({
    question,
    recentHistory: input.recentHistory,
    lectureTitle: input.lectureTitle,
    courseTitle: input.courseTitle,
  });

  if (expandedQuery !== question) {
    chunks = await searchChunks(expandedQuery, input, deps, searchConfig.minScore);
    if (chunks.length > 0) {
      return { chunks, hasResults: true, usedFallback: false };
    }
  }

  if (input.lectureId) {
    const fallbackQuery = expandedQuery !== question ? expandedQuery : question;
    chunks = await searchChunks(fallbackQuery, input, deps, 0);
    if (chunks.length > 0) {
      return { chunks, hasResults: true, usedFallback: false };
    }
  }

  return { chunks: [], hasResults: false, usedFallback: true };
}
