import { CourseStatus, CourseVisibility, Prisma, Role } from '@prisma/client';
import type {
  CatalogViewer,
  CourseCatalogPublicItem,
} from '../dto/course-catalog.dto';

export type ViewerRole = 'guest' | 'student' | 'instructor' | 'admin';

export function resolveViewerRole(viewer: CatalogViewer): ViewerRole {
  if (!viewer?.id) return 'guest';
  if (viewer.role === Role.ADMIN) return 'admin';
  if (viewer.role === Role.INSTRUCTOR) return 'instructor';
  return 'student';
}

const PUBLIC_CATALOG_WHERE: Prisma.CourseWhereInput = {
  status: CourseStatus.PUBLISHED,
  visibility: CourseVisibility.PUBLIC,
};

/** Pre-query visibility filter applied before DB fetch. */
export function buildVisibilityWhere(
  viewer: CatalogViewer,
): Prisma.CourseWhereInput {
  const role = resolveViewerRole(viewer);

  if (role === 'admin') {
    return {};
  }

  if (role === 'instructor' && viewer?.id) {
    return {
      OR: [PUBLIC_CATALOG_WHERE, { instructorId: viewer.id }],
    };
  }

  return PUBLIC_CATALOG_WHERE;
}

/** Post-query safety filter (defense in depth). */
export function isCourseVisibleToViewer(
  course: Pick<
    CourseCatalogPublicItem,
    'status' | 'visibility' | 'instructorId'
  >,
  viewer: CatalogViewer,
): boolean {
  const role = resolveViewerRole(viewer);

  if (role === 'admin') return true;
  if (viewer?.id && course.instructorId === viewer.id) return true;

  return (
    course.status === CourseStatus.PUBLISHED &&
    course.visibility === CourseVisibility.PUBLIC
  );
}
