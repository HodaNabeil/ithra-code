import type { EmbeddingPort } from '../../domain/ports/EmbeddingPort';
import type { VectorSearchPort } from '../../domain/ports/VectorSearchPort';
import { AI_TUTOR_CONSTANTS } from '../../shared';
import type {
  ContentRetrievalResult,
  RetrievedContentChunk,
} from '../dto/retrieved-content.dto';

export type RetrieveRelevantContentInput = {
  question: string;
  courseId: string;
  lectureId?: string;
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

export async function retrieveRelevantContent(
  input: RetrieveRelevantContentInput,
  deps: ContentRetrieverDeps,
): Promise<ContentRetrievalResult> {
  const question = input.question.trim();
  if (!question) {
    return { chunks: [], hasResults: false, usedFallback: true };
  }

  const { embedding } = await deps.embeddingPort.generateEmbedding(question);
  const searchConfig = deps.vectorSearchConfig ?? {
    topK: AI_TUTOR_CONSTANTS.MAX_RETRIEVED_CHUNKS,
    minScore: AI_TUTOR_CONSTANTS.MIN_RELEVANCE_SCORE,
  };

  const results = await deps.vectorSearchPort.search(embedding, {
    topK: searchConfig.topK,
    minScore: searchConfig.minScore,
    filter: {
      courseId: input.courseId,
      lectureId: input.lectureId,
    },
  });

  const chunks = mapSearchResults(results);

  return {
    chunks,
    hasResults: chunks.length > 0,
    usedFallback: chunks.length === 0,
  };
}
