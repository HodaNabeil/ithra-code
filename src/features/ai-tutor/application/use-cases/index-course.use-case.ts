import { Role } from '@/generated/prisma/enums';

import type { IndexCourseInputDTO, IndexCourseResultDTO } from '../dto/index-course.dto';
import { IndexingError, IndexingErrorCodes } from '../errors/indexing.errors';
import {
  buildChunkRecords,
  extractCourseSources,
  loadCourseForIndexing,
} from '../services/content-extraction.service';
import { embedChunkRecords } from '../services/embedding-pipeline.service';
import type { EmbeddingPort } from '../../domain/ports/EmbeddingPort';
import type { KnowledgeChunkRepositoryPort } from '../../domain/ports/KnowledgeChunkRepositoryPort';
import type { CourseContentRepositoryPort } from '../../domain/ports/CourseContentRepositoryPort';

export type IndexCourseUseCaseDeps = {
  embeddingPort: EmbeddingPort;
  knowledgeChunkRepository: KnowledgeChunkRepositoryPort;
  courseContentRepository: CourseContentRepositoryPort;
};

async function assertCanIndexCourse(params: {
  courseId: string;
  instructorId: string;
  userId: string;
  userRole?: string;
}): Promise<void> {
  if (params.userRole === Role.ADMIN) {
    return;
  }

  if (params.userId === params.instructorId) {
    return;
  }

  throw new IndexingError(
    403,
    'غير مصرح لك بفهرسة هذه الدورة',
    IndexingErrorCodes.UNAUTHORIZED,
  );
}

export async function indexCourseUseCase(
  input: IndexCourseInputDTO & { userId: string; userRole?: string },
  deps: IndexCourseUseCaseDeps,
): Promise<IndexCourseResultDTO> {
  try {
    const course = await loadCourseForIndexing(input.courseSlug, {
      courseContentRepository: deps.courseContentRepository,
    });

    await assertCanIndexCourse({
      courseId: course.id,
      instructorId: course.instructorId,
      userId: input.userId,
      userRole: input.userRole,
    });

    const { sources, stats } = await extractCourseSources(course);
    if (sources.length === 0) {
      throw new IndexingError(
        400,
        'لا يوجد محتوى نصي قابل للفهرسة في هذه الدورة',
        IndexingErrorCodes.NO_CONTENT,
      );
    }

    const chunkRecords = buildChunkRecords(sources);
    if (chunkRecords.length === 0) {
      throw new IndexingError(
        400,
        'لم يتم إنشاء أي مقاطع من محتوى الدورة',
        IndexingErrorCodes.NO_CONTENT,
      );
    }

    const indexedChunks = await embedChunkRecords(chunkRecords, deps.embeddingPort);

    await deps.knowledgeChunkRepository.deleteByCourseId(course.id);
    await deps.knowledgeChunkRepository.insertMany(indexedChunks);
    await deps.knowledgeChunkRepository.markCourseIndexed(course.id);

    return {
      courseId: course.id,
      courseSlug: course.slug,
      chunksIndexed: indexedChunks.length,
      sourcesProcessed: sources.length,
      attachmentsSkipped: stats.attachmentsSkipped,
      indexedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof IndexingError) {
      throw error;
    }

    console.error('[INDEX_COURSE_USE_CASE_ERROR]', error);
    throw new IndexingError(
      500,
      'فشل فهرسة محتوى الدورة',
      IndexingErrorCodes.STORAGE_FAILED,
    );
  }
}
