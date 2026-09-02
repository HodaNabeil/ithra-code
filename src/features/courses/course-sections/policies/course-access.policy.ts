import { CourseStatus, Role } from '@prisma/client';
import {
  CourseSectionsError,
  courseNotFoundMessage,
} from '../errors/course-sections.errors';
import type {
  CourseSectionsIdentity,
  CourseSectionsViewer,
} from '../dto/course-sections.dto';

export function isStaffViewer(
  course: CourseSectionsIdentity,
  viewer: CourseSectionsViewer,
): boolean {
  if (viewer?.role === Role.ADMIN) return true;
  if (viewer?.id && viewer.id === course.instructorId) return true;
  return false;
}

export function assertCourseSectionsAccessible(
  course: CourseSectionsIdentity,
  courseIdOrSlug: string,
  viewer: CourseSectionsViewer,
): void {
  if (isStaffViewer(course, viewer)) return;

  if (course.status !== CourseStatus.PUBLISHED) {
    throw new CourseSectionsError(
      404,
      courseNotFoundMessage(courseIdOrSlug),
      'COURSE_NOT_FOUND',
    );
  }
}

export function resolvePublishedOnly(
  course: CourseSectionsIdentity,
  viewer: CourseSectionsViewer,
): boolean {
  return !isStaffViewer(course, viewer);
}

export function resolveCacheScope(
  course: CourseSectionsIdentity,
  viewer: CourseSectionsViewer,
): 'public' | 'staff' {
  return isStaffViewer(course, viewer) ? 'staff' : 'public';
}
