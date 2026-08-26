import type {
  CourseListItem,
  CourseListPublicItem,
  CourseListPublicResult,
  CourseListQuery,
  CourseListResult,
  CourseViewer,
} from '../dto/course-list.dto';
import {
  courseListCache,
  resolveCacheScope,
} from '../cache/course-list.cache';
import { mapToPublicItem } from '../mapper/to-course-list-dto';
import {
  buildVisibilityWhere,
  isCourseVisibleToViewer,
} from '../policies/course-visibility.policy';
import {
  courseListRepository,
  type CourseListRepository,
} from '../repository/course-list.repository';

export type ListCoursesInput = {
  query: CourseListQuery;
  viewer?: CourseViewer;
};

function withDefaultUserFields(
  items: CourseListPublicItem[],
): CourseListItem[] {
  return items.map((item) => ({
    ...item,
    isInCart: false,
    isPurchased: false,
  }));
}

function mergeUserSignals(
  items: CourseListPublicItem[],
  cartCourseIds: Set<string>,
  enrolledCourseIds: Set<string>,
): CourseListItem[] {
  return items.map((item) => ({
    ...item,
    isInCart: cartCourseIds.has(item.id),
    isPurchased: enrolledCourseIds.has(item.id),
  }));
}

async function loadPublicCourseList(
  query: CourseListQuery,
  viewer: CourseViewer,
  repository: CourseListRepository,
): Promise<CourseListPublicResult> {
  const scope = resolveCacheScope(viewer);

  const cached = await courseListCache.get(scope, query);
  if (cached) return cached;

  const visibilityWhere = buildVisibilityWhere(viewer);
  const { items: rows, total } = await repository.findManyWithCount({
    where: visibilityWhere,
    query,
  });

  const items = rows
    .map(mapToPublicItem)
    .filter((item) => isCourseVisibleToViewer(item, viewer));

  const result: CourseListPublicResult = {
    items,
    pagination: {
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    },
  };

  await courseListCache.set(scope, query, result);
  return result;
}

/** API use-case: Redis cache + RBAC visibility + user signal merge. */
export async function listCourses(
  input: ListCoursesInput,
  repository: CourseListRepository = courseListRepository,
): Promise<CourseListResult> {
  const viewer = input.viewer ?? null;
  const publicResult = await loadPublicCourseList(
    input.query,
    viewer,
    repository,
  );

  if (!viewer?.id) {
    return {
      courses: withDefaultUserFields(publicResult.items),
      pagination: publicResult.pagination,
    };
  }

  const [cartCourseIds, enrolledCourseIds] = await Promise.all([
    repository.findUserCartCourseIds(viewer.id),
    repository.findUserEnrolledCourseIds(viewer.id),
  ]);

  return {
    courses: mergeUserSignals(
      publicResult.items,
      cartCourseIds,
      enrolledCourseIds,
    ),
    pagination: publicResult.pagination,
  };
}
