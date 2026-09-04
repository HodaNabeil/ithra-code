import { ZodError } from 'zod';

import { courseNotFoundMessage } from '@/features/courses/course-sections/errors/course-sections.errors';
import {
  courseSectionsRepository,
  isProgressEligibleEnrollment,
  type CourseSectionsRepository,
} from '@/features/courses/course-sections/repository/course-sections.repository';

import type { ListCourseLectureProgressResponse } from '../dto/lecture-progress.dto';
import { LectureProgressError } from '../errors/lecture-progress.errors';
import { mapProgressToDTO } from '../mapper/lecture-progress.mapper';
import {
  lectureProgressRepository,
  type LectureProgressRepository,
} from '../repository/lecture-progress.repository';
import { parseListCourseLectureProgressParams } from '../validation/lecture-progress.validation';

export type ListCourseLectureProgressInput = {
  courseIdOrSlug: string;
  userId: string;
};

export async function listCourseLectureProgress(
  input: ListCourseLectureProgressInput,
  courseRepository: CourseSectionsRepository = courseSectionsRepository,
  progressRepository: LectureProgressRepository = lectureProgressRepository,
): Promise<ListCourseLectureProgressResponse> {
  let courseIdOrSlug: string;

  try {
    ({ courseIdOrSlug } = parseListCourseLectureProgressParams({
      courseIdOrSlug: input.courseIdOrSlug,
    }));
  } catch (error) {
    if (error instanceof ZodError) {
      throw new LectureProgressError(
        400,
        error.issues[0]?.message ?? 'Invalid request',
      );
    }
    throw error;
  }

  const course = await courseRepository.findCourseIdByIdOrSlug(courseIdOrSlug);

  if (!course) {
    throw new LectureProgressError(
      404,
      courseNotFoundMessage(courseIdOrSlug),
      'COURSE_NOT_FOUND',
    );
  }

  const enrollment = await courseRepository.findEnrollment(
    input.userId,
    course.id,
  );

  if (!enrollment || !isProgressEligibleEnrollment(enrollment)) {
    throw new LectureProgressError(
      404,
      courseNotFoundMessage(courseIdOrSlug),
      'NOT_ENROLLED',
    );
  }

  const records = await progressRepository.findByEnrollmentId(enrollment.id);
  const progress = records.map(mapProgressToDTO);

  return {
    progress,
    total: progress.length,
  };
}
