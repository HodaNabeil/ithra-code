import { Role } from '@/generated/prisma/enums';

import type { IndexCourseInputDTO, IndexCourseResultDTO } from '../dto/index-course.dto';
import { IndexingError, IndexingErrorCodes } from '../errors/indexing.errors';
import { loadCourseForIndexing } from '../services/content-extraction.service';
import { runCourseIndexing } from '../services/course-indexing-runner.service';
import type { EmbeddingPort } from '../../domain/ports/EmbeddingPort';
import type { KnowledgeChunkRepositoryPort } from '../../domain/ports/KnowledgeChunkRepositoryPort';
import type { KnowledgeSourceHashRepositoryPort } from '../../domain/ports/KnowledgeSourceHashRepositoryPort';
import type { CourseContentRepositoryPort } from '../../domain/ports/CourseContentRepositoryPort';

export type IndexCourseUseCaseDeps = {
  embeddingPort: EmbeddingPort;
  knowledgeChunkRepository: KnowledgeChunkRepositoryPort;
  hashRepository: KnowledgeSourceHashRepositoryPort;
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

    return await runCourseIndexing(course, deps);
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
