import { ZodError } from 'zod';

import {
  courseSectionsRepository,
  isProgressEligibleEnrollment,
  type CourseSectionsRepository,
} from '@/features/courses/course-sections/repository/course-sections.repository';
import {
  LectureDetailError,
  isStudentVisibleLectureContent,
  lectureNotFoundMessage,
} from '@/features/courses/lecture-detail';
import { parseLectureDetailParams } from '@/features/courses/lecture-detail/validation/lecture-detail.validation';
import { parseUpdateLectureProgressParams } from '../validation/lecture-progress.validation';

import type { ProgressRecordDTO } from '../dto/lecture-progress.dto';
import { LectureProgressError } from '../errors/lecture-progress.errors';
import { mapProgressToDTO } from '../mapper/lecture-progress.mapper';
import {
  lectureProgressRepository,
  type LectureProgressRepository,
} from '../repository/lecture-progress.repository';

export type GetLectureProgressInput = {
  courseIdOrSlug: string;
  lectureId: string;
  userId: string;
};

export async function getLectureProgress(
  input: GetLectureProgressInput,
  repository: LectureProgressRepository = lectureProgressRepository,
  courseRepository: CourseSectionsRepository = courseSectionsRepository,
): Promise<ProgressRecordDTO | null> {
  let lectureId: string;
  let courseIdOrSlug: string;

  try {
    ({ lectureId, courseIdOrSlug } = parseUpdateLectureProgressParams({
      courseIdOrSlug: input.courseIdOrSlug,
      lectureId: input.lectureId,
    }));
    parseLectureDetailParams({ lectureId });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new LectureProgressError(
        400,
        error.issues[0]?.message ?? 'Invalid request',
      );
    }
    if (error instanceof LectureDetailError) {
      throw new LectureProgressError(error.status, error.message, error.code);
    }
    throw error;
  }

  const lecture = await repository.findLectureContext(lectureId);

  if (!lecture) {
    throw new LectureProgressError(
      404,
      lectureNotFoundMessage(lectureId),
      'LECTURE_NOT_FOUND',
    );
  }

  const course = await courseRepository.findCourseIdentity(courseIdOrSlug);

  if (!course || course.id !== lecture.courseId) {
    throw new LectureProgressError(
      404,
      lectureNotFoundMessage(lectureId),
      'LECTURE_NOT_FOUND',
    );
  }

  if (
    !isStudentVisibleLectureContent(
      { isPublished: lecture.sectionIsPublished },
      { isPublished: lecture.lectureIsPublished },
    )
  ) {
    throw new LectureProgressError(
      404,
      lectureNotFoundMessage(lectureId),
      'LECTURE_NOT_FOUND',
    );
  }

  const enrollment = await repository.findEnrollment(
    input.userId,
    lecture.courseId,
  );

  if (!enrollment || !isProgressEligibleEnrollment(enrollment)) {
    throw new LectureProgressError(
      404,
      lectureNotFoundMessage(lectureId),
      'LECTURE_NOT_FOUND',
    );
  }

  const existing = await repository.findProgress(enrollment.id, lectureId);

  return existing ? mapProgressToDTO(existing) : null;
}
