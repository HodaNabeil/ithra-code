import type { CourseForIndexingDTO } from '../../domain/ports/CourseContentRepositoryPort';
import type { IndexCourseResultDTO } from '../dto/index-course.dto';
import type { IndexLectureResultDTO } from '../dto/index-lecture.dto';
import { IndexingError, IndexingErrorCodes } from '../errors/indexing.errors';
import {
  ingestCourseKnowledge,
  ingestLectureKnowledge,
  type KnowledgeIngestionDeps,
} from './knowledge-ingestion/knowledge-ingestion-pipeline.service';
import type { IndexCourseUseCaseDeps } from '../use-cases/index-course.use-case';

function toIngestionDeps(deps: IndexCourseUseCaseDeps): KnowledgeIngestionDeps {
  return {
    embeddingPort: deps.embeddingPort,
    knowledgeChunkRepository: deps.knowledgeChunkRepository,
    hashRepository: deps.hashRepository,
  };
}

export async function runCourseIndexing(
  course: CourseForIndexingDTO,
  deps: IndexCourseUseCaseDeps,
): Promise<IndexCourseResultDTO> {
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
  deps: IndexCourseUseCaseDeps,
): Promise<IndexLectureResultDTO> {
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
