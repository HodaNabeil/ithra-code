import { CourseStatus, CourseVisibility, Role } from '@prisma/client';
import {
  COURSE_NOT_FOUND_MESSAGE,
  CourseOverviewError,
} from '../errors/course-overview.errors';
import type {
  CourseOverviewCacheScope,
  CourseOverviewIdentity,
} from '../dto/course-overview.dto';

export type CourseOverviewViewer = {
  id: string;
  role?: string;
} | null;

export function isStaffViewer(
  course: CourseOverviewIdentity,
  viewer: CourseOverviewViewer,
): boolean {
  if (viewer?.role === Role.ADMIN) return true;
  if (viewer?.id && viewer.id === course.instructorId) return true;
  return false;
}

export function resolveCacheScope(
  course: CourseOverviewIdentity,
  viewer: CourseOverviewViewer,
): CourseOverviewCacheScope {
  return isStaffViewer(course, viewer) ? 'staff' : 'public';
}

export function assertCourseOverviewVisible(
  course: CourseOverviewIdentity,
  viewer: CourseOverviewViewer,
): void {
  if (isStaffViewer(course, viewer)) return;

  const isPublished = course.status === CourseStatus.PUBLISHED;
  const isPubliclyAccessible =
    course.visibility === CourseVisibility.PUBLIC ||
    course.visibility === CourseVisibility.UNLISTED;

  if (!isPublished || !isPubliclyAccessible) {
    throw new CourseOverviewError(
      404,
      COURSE_NOT_FOUND_MESSAGE,
      'COURSE_NOT_FOUND',
    );
  }
}
