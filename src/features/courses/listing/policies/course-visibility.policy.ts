import { CourseStatus, CourseVisibility, Prisma, Role } from '@prisma/client';
import type {
  CourseListPublicItem,
  CourseViewer,
} from '../dto/course-list.dto';

export type ViewerRole = 'guest' | 'student' | 'instructor' | 'admin';

export function resolveViewerRole(viewer: CourseViewer): ViewerRole {
  if (!viewer?.id) return 'guest';
  if (viewer.role === Role.ADMIN) return 'admin';
  if (viewer.role === Role.INSTRUCTOR) return 'instructor';
  return 'student';
}

const PUBLIC_LISTING_WHERE: Prisma.CourseWhereInput = {
  status: CourseStatus.PUBLISHED,
  visibility: CourseVisibility.PUBLIC,
};

/** Pre-query visibility filter applied before DB fetch. */
export function buildVisibilityWhere(
  viewer: CourseViewer,
): Prisma.CourseWhereInput {
  const role = resolveViewerRole(viewer);

  if (role === 'admin') {
    return {};
  }

  if (role === 'instructor' && viewer?.id) {
    return {
      OR: [PUBLIC_LISTING_WHERE, { instructorId: viewer.id }],
    };
  }

  return PUBLIC_LISTING_WHERE;
}

/** Post-query safety filter (defense in depth). */
export function isCourseVisibleToViewer(
  course: Pick<
    CourseListPublicItem,
    'status' | 'visibility' | 'instructorId'
  >,
  viewer: CourseViewer,
): boolean {
  const role = resolveViewerRole(viewer);

  if (role === 'admin') return true;
  if (viewer?.id && course.instructorId === viewer.id) return true;

  return (
    course.status === CourseStatus.PUBLISHED &&
    course.visibility === CourseVisibility.PUBLIC
  );
}
