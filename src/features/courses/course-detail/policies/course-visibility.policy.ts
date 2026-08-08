import { CourseStatus, CourseVisibility, Role } from '@prisma/client';
import {
  COURSE_NOT_FOUND_MESSAGE,
  CourseDetailError,
} from '../errors/course-detail.errors';
import type { CourseDetailPublicDTO } from '../dto/course-detail.dto';

export type CourseVisibilityUser = {
  id: string;
  role?: string;
};

export function assertCourseVisible(
  course: CourseDetailPublicDTO,
  user?: CourseVisibilityUser | null,
): void {
  if (user?.role === Role.ADMIN) return;
  if (user?.id === course.instructorId) return;

  const isPublished = course.status === CourseStatus.PUBLISHED;
  const isPubliclyAccessible =
    course.visibility === CourseVisibility.PUBLIC ||
    course.visibility === CourseVisibility.UNLISTED;

  if (!isPublished || !isPubliclyAccessible) {
    throw new CourseDetailError(404, COURSE_NOT_FOUND_MESSAGE, 'COURSE_NOT_FOUND');
  }
}
