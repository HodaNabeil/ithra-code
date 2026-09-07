import { ZodError } from 'zod';

import { courseNotFoundMessage } from '@/features/courses/course-sections/errors/course-sections.errors';
import {
  courseSectionsRepository,
  isProgressEligibleEnrollment,
  type CourseSectionsRepository,
} from '@/features/courses/course-sections/repository/course-sections.repository';

import type { CourseProgressDTO } from '../dto/course-progress.dto';
import { CourseProgressError } from '../errors/course-progress.errors';
import {
  courseProgressRepository,
  type CourseProgressRepository,
} from '../repository/course-progress.repository';
import { parseGetCourseProgressParams } from '../validation/course-progress.validation';

export type GetCourseProgressInput = {
  courseIdOrSlug: string;
  userId: string;
};

export async function getCourseProgress(
  input: GetCourseProgressInput,
  courseRepository: CourseSectionsRepository = courseSectionsRepository,
  progressRepository: CourseProgressRepository = courseProgressRepository,
): Promise<CourseProgressDTO> {
  let courseIdOrSlug: string;

  try {
    ({ courseIdOrSlug } = parseGetCourseProgressParams({
      courseIdOrSlug: input.courseIdOrSlug,
    }));
  } catch (error) {
    if (error instanceof ZodError) {
      throw new CourseProgressError(
        400,
        error.issues[0]?.message ?? 'Invalid request',
      );
    }
    throw error;
  }

  const course = await courseRepository.findCourseIdentity(courseIdOrSlug);

  if (!course) {
    throw new CourseProgressError(
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
    throw new CourseProgressError(
      404,
      courseNotFoundMessage(courseIdOrSlug),
      'COURSE_NOT_FOUND',
    );
  }

  return progressRepository.findStatsByEnrollment(enrollment.id, course.id);
}
