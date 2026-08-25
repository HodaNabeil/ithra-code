import { CourseStatus, CourseVisibility, Prisma, Role } from '@prisma/client';
import type { PathViewer } from '../dto/path-catalog.dto';

const PUBLISHED_PATH_WHERE: Prisma.PathWhereInput = {
  isPublished: true,
};

/** Whether catalog queries should restrict to published paths only. */
export function resolvePublishedOnlyForCatalog(viewer: PathViewer): boolean {
  if (!viewer?.id) return true;
  return viewer.role !== Role.ADMIN;
}

/** Pre-query visibility filter applied before DB fetch. */
export function buildPathVisibilityWhere(
  viewer: PathViewer,
): Prisma.PathWhereInput {
  if (resolvePublishedOnlyForCatalog(viewer)) {
    return PUBLISHED_PATH_WHERE;
  }
  return {};
}

/** Post-query safety filter for paths (defense in depth). */
export function filterPathForAudience(
  path: { isPublished: boolean },
  viewer: PathViewer,
): boolean {
  if (viewer?.role === Role.ADMIN) return true;
  return path.isPublished;
}

/** Post-query safety filter for tracks nested under a path. */
export function filterTrackForAudience(
  track: { isPublished: boolean },
  viewer: PathViewer,
): boolean {
  if (viewer?.role === Role.ADMIN) return true;
  return track.isPublished;
}

/** Post-query safety filter for courses nested under a track. */
export function filterCourseForAudience(
  course: { status: CourseStatus; visibility: CourseVisibility },
  viewer: PathViewer,
): boolean {
  if (viewer?.role === Role.ADMIN) return true;

  return (
    course.status === CourseStatus.PUBLISHED &&
    course.visibility === CourseVisibility.PUBLIC
  );
}
