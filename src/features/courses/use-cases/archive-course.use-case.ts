import { CourseStatus } from '@prisma/client';
import {
  ArchiveCourseError,
  COURSE_NOT_FOUND_MESSAGE,
} from '../errors/archive-course.errors';
import {
  courseRepository,
  type CourseRepository,
} from '../repositories/course.repository';
import {
  assertCanArchiveCourse,
  assertCourseOwnership,
} from '../services/course-authorization.service';
import { courseCacheService } from '../services/course-cache.service';
import type {
  ArchiveCourseInput,
  ArchiveCourseResult,
} from '../types/archive-course.types';

/** Soft-deletes a course by setting status to ARCHIVED and recording archivedAt. */
export async function archiveCourseUseCase(
  input: ArchiveCourseInput,
  repository: CourseRepository = courseRepository,
): Promise<ArchiveCourseResult> {
  const { idOrSlug, user } = input;

  assertCanArchiveCourse(user);

  const course = await repository.findByIdOrSlug(idOrSlug);
  if (!course) {
    throw new ArchiveCourseError(
      404,
      COURSE_NOT_FOUND_MESSAGE,
      'COURSE_NOT_FOUND',
    );
  }

  assertCourseOwnership(user, course.instructorId);

  if (course.status !== CourseStatus.ARCHIVED) {
    await repository.archive(course.id);
  }

  void courseCacheService.invalidateAfterArchive(course.slug);

  return { archived: true };
}
