import { Role } from '@prisma/client';
import { CourseCreationError } from '../errors/course-creation.errors';

const ALLOWED_ROLES = new Set<string>([Role.INSTRUCTOR, Role.ADMIN]);

/** Throws CourseCreationError(403) if user lacks COURSE_CREATE permission. */
export function assertCanCreateCourse(role: string | undefined): void {
  if (!role || !ALLOWED_ROLES.has(role)) {
    throw new CourseCreationError(
      403,
      'You do not have permission to create courses',
      'COURSE_CREATE_FORBIDDEN',
    );
  }
}
