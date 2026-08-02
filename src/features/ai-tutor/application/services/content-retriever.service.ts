import type { EmbeddingPort } from '../../domain/ports/EmbeddingPort';
import type { VectorSearchPort } from '../../domain/ports/VectorSearchPort';
import {
  getCachedEmbedding,
  setCachedEmbedding,
} from '../../infrastructure/cache/embedding-cache';
import { AI_TUTOR_CONSTANTS } from '../../shared';
import type {
  ContentRetrievalResult,
  RetrievedContentChunk,
} from '../dto/retrieved-content.dto';
import {
  buildRetrievalQuery,
  type RetrievalHistoryMessage,
} from './rag-helpers';

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
    topK: AI_TUTOR_CONSTANTS.MAX_RETRIEVED_CHUNKS,
    minScore: AI_TUTOR_CONSTANTS.MIN_RELEVANCE_SCORE,
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
  const question = input.question.trim();
  if (!question) {
    return { chunks: [], hasResults: false, usedFallback: true };
  }

  const searchConfig = deps.vectorSearchConfig ?? {
    topK: AI_TUTOR_CONSTANTS.MAX_RETRIEVED_CHUNKS,
    minScore: AI_TUTOR_CONSTANTS.MIN_RELEVANCE_SCORE,
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
