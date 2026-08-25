import type {
  CatalogViewer,
  CourseCatalogItem,
  CourseCatalogPublicItem,
  CourseCatalogPublicResult,
  CourseCatalogQuery,
  CourseCatalogResult,
} from '../dto/course-catalog.dto';
import {
  courseCatalogCache,
  resolveCacheScope,
} from '../cache/course-catalog.cache';
import { mapToPublicItem } from '../mapper/to-catalog-dto';
import {
  buildVisibilityWhere,
  isCourseVisibleToViewer,
} from '../policies/course-visibility.policy';
import {
  courseCatalogRepository,
  type CourseCatalogRepository,
} from '../repository/course-catalog.repository';

export type GetCourseCatalogInput = {
  query: CourseCatalogQuery;
  viewer?: CatalogViewer;
};

function withDefaultUserFields(
  items: CourseCatalogPublicItem[],
): CourseCatalogItem[] {
  return items.map((item) => ({
    ...item,
    isInCart: false,
    isPurchased: false,
  }));
}

function mergeUserSignals(
  items: CourseCatalogPublicItem[],
  cartCourseIds: Set<string>,
  enrolledCourseIds: Set<string>,
): CourseCatalogItem[] {
  return items.map((item) => ({
    ...item,
    isInCart: cartCourseIds.has(item.id),
    isPurchased: enrolledCourseIds.has(item.id),
  }));
}

async function loadPublicCatalog(
  query: CourseCatalogQuery,
  viewer: CatalogViewer,
  repository: CourseCatalogRepository,
): Promise<CourseCatalogPublicResult> {
  const scope = resolveCacheScope(viewer);

  const cached = await courseCatalogCache.get(scope, query);
  if (cached) return cached;

  const visibilityWhere = buildVisibilityWhere(viewer);
  const { items: rows, total } = await repository.findManyWithCount({
    where: visibilityWhere,
    query,
  });

  const items = rows
    .map(mapToPublicItem)
    .filter((item) => isCourseVisibleToViewer(item, viewer));

  const result: CourseCatalogPublicResult = {
    items,
    pagination: {
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    },
  };

  await courseCatalogCache.set(scope, query, result);
  return result;
}

/** API use-case: Redis cache + RBAC visibility + user signal merge. */
export async function getCourseCatalog(
  input: GetCourseCatalogInput,
  repository: CourseCatalogRepository = courseCatalogRepository,
): Promise<CourseCatalogResult> {
  const viewer = input.viewer ?? null;
  const publicResult = await loadPublicCatalog(input.query, viewer, repository);

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
