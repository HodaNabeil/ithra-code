import { Role } from '@/generated/prisma/enums';

import type { IndexLectureResultDTO } from '../dto/index-lecture.dto';
import { IndexingError, IndexingErrorCodes } from '../errors/indexing.errors';
import { loadCourseForIndexing } from '../services/content-extraction.service';
import { runLectureIndexing } from '@/ai-platform/indexing/pipelines/course-indexing.pipeline';
import type { IndexCourseUseCaseDeps } from './index-course.use-case';

export type IndexLectureInput = {
  courseSlug: string;
  lectureId: string;
  userId: string;
  userRole?: string;
};

async function assertCanIndexCourse(params: {
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

export async function indexLectureUseCase(
  input: IndexLectureInput,
  deps: IndexCourseUseCaseDeps,
): Promise<IndexLectureResultDTO> {
  try {
    const course = await loadCourseForIndexing(input.courseSlug, {
      courseContentRepository: deps.courseContentRepository,
    });

    await assertCanIndexCourse({
      instructorId: course.instructorId,
      userId: input.userId,
      userRole: input.userRole,
    });

    const lectureExists = course.sections.some((section) =>
      section.lectures.some((lecture) => lecture.id === input.lectureId),
    );

    if (!lectureExists) {
      throw new IndexingError(
        404,
        'المحاضرة غير موجودة أو غير منشورة',
        IndexingErrorCodes.COURSE_NOT_FOUND,
      );
    }

    return await runLectureIndexing(course, input.lectureId, deps);
  } catch (error) {
    if (error instanceof IndexingError) {
      throw error;
    }

    console.error('[INDEX_LECTURE_USE_CASE_ERROR]', error);
    throw new IndexingError(
      500,
      'فشل فهرسة محتوى المحاضرة',
      IndexingErrorCodes.STORAGE_FAILED,
    );
  }
}
