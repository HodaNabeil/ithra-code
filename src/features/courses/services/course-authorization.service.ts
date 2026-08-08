import { Role } from '@prisma/client';
import { ArchiveCourseError } from '../errors/archive-course.errors';
import type { AuthenticatedUser } from '../types/authenticated-user.types';

const ARCHIVE_ALLOWED_ROLES = new Set<string>([Role.ADMIN, Role.INSTRUCTOR]);

/** Throws 403 if the user's role cannot archive courses. */
export function assertCanArchiveCourse(user: AuthenticatedUser): void {
  if (!ARCHIVE_ALLOWED_ROLES.has(user.role)) {
    throw new ArchiveCourseError(
      403,
      'You do not have permission to archive courses',
      'ARCHIVE_FORBIDDEN',
    );
  }
}

/** Throws 403 if an instructor tries to archive a course they do not own. */
export function assertCourseOwnership(
  user: AuthenticatedUser,
  instructorId: string,
): void {
  if (user.role === Role.ADMIN) return;

  if (user.role === Role.INSTRUCTOR && user.id === instructorId) return;

  throw new ArchiveCourseError(
    403,
    'You can only archive your own courses',
    'OWNERSHIP_FORBIDDEN',
  );
}
