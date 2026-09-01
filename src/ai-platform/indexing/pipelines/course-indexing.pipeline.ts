import type { CourseForIndexingDTO } from '@/ai-platform/indexing/domain/ports/CourseContentRepositoryPort';
import type { KnowledgeChunkRepositoryPort } from '@/ai-platform/indexing/domain/ports/KnowledgeChunkRepositoryPort';
import type { KnowledgeSourceHashRepositoryPort } from '@/ai-platform/indexing/domain/ports/KnowledgeSourceHashRepositoryPort';

import type { EmbeddingPort } from '../../domain/ports/embedding.port';
import {
  IndexingError,
  IndexingErrorCodes,
} from '../../application/errors/indexing.error';
import {
  ingestCourseKnowledge,
  ingestLectureKnowledge,
  type KnowledgeIngestionDeps,
} from '../../rag/ingestion/knowledge-ingestion-pipeline.service';

export type CourseIndexingResult = {
  courseId: string;
  courseSlug: string;
  chunksIndexed: number;
  sourcesProcessed: number;
  attachmentsSkipped?: number;
  sourcesUnchanged?: number;
  errors?: number;
  indexedAt: string;
};

export type LectureIndexingResult = CourseIndexingResult & {
  lectureId: string;
};

export type CourseIndexingDeps = {
  embeddingPort: EmbeddingPort;
  knowledgeChunkRepository: KnowledgeChunkRepositoryPort;
  hashRepository: KnowledgeSourceHashRepositoryPort;
};

function toIngestionDeps(deps: CourseIndexingDeps): KnowledgeIngestionDeps {
  return {
    embeddingPort: deps.embeddingPort,
    knowledgeChunkRepository: deps.knowledgeChunkRepository,
    hashRepository: deps.hashRepository,
  };
}

export async function runCourseIndexing(
  course: CourseForIndexingDTO,
  deps: CourseIndexingDeps,
): Promise<CourseIndexingResult> {
  const result = await ingestCourseKnowledge(course, toIngestionDeps(deps));

  if (result.sourcesCollected === 0) {
    throw new IndexingError(
      400,
      'لا يوجد محتوى نصي قابل للفهرسة في هذه الدورة',
      IndexingErrorCodes.NO_CONTENT,
    );
  }

  if (result.chunksIndexed === 0 && result.sourcesUnchanged === 0) {
    throw new IndexingError(
      400,
      'لم يتم إنشاء أي مقاطع من محتوى الدورة',
      IndexingErrorCodes.NO_CONTENT,
    );
  }

  return {
    courseId: result.courseId,
    courseSlug: result.courseSlug,
    chunksIndexed: result.chunksIndexed,
    sourcesProcessed: result.sourcesExtracted,
    attachmentsSkipped: result.sourcesSkipped,
    sourcesUnchanged: result.sourcesUnchanged,
    errors: result.errors,
    indexedAt: new Date().toISOString(),
  };
}

export async function runLectureIndexing(
  course: CourseForIndexingDTO,
  lectureId: string,
  deps: CourseIndexingDeps,
): Promise<LectureIndexingResult> {
  const result = await ingestLectureKnowledge(
    course,
    lectureId,
    toIngestionDeps(deps),
  );

  return {
    courseId: result.courseId,
    courseSlug: result.courseSlug,
    lectureId,
    chunksIndexed: result.chunksIndexed,
    sourcesProcessed: result.sourcesExtracted,
    attachmentsSkipped: result.sourcesSkipped,
    sourcesUnchanged: result.sourcesUnchanged,
    errors: result.errors,
    indexedAt: new Date().toISOString(),
  };
}
