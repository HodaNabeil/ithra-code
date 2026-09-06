import type {
  CourseListItem,
  CourseListPublicItem,
  CourseListPublicResult,
  CourseListQuery,
  CourseListResult,
  CourseViewer,
} from '../dto/course-list.dto';
import {
  getCourseProgress,
  type CourseProgressDTO,
} from '@/features/courses/course-progress';
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
  progressMap?: Map<string, CourseProgressDTO>,
): CourseListItem[] {
  return items.map((item) => {
    const isPurchased = enrolledCourseIds.has(item.id);
    const progress = isPurchased ? progressMap?.get(item.id) : undefined;

    return {
      ...item,
      isInCart: cartCourseIds.has(item.id),
      isPurchased,
      progressPercentage: progress?.completionPercentage,
      progress,
    };
  });
}

async function fetchEnrolledProgressMap(
  items: CourseListPublicItem[],
  enrolledCourseIds: Set<string>,
  userId: string,
): Promise<Map<string, CourseProgressDTO>> {
  const progressMap = new Map<string, CourseProgressDTO>();
  const enrolledItems = items.filter((item) => enrolledCourseIds.has(item.id));

  if (enrolledItems.length === 0) return progressMap;

  const results = await Promise.all(
    enrolledItems.map(async (item) => {
      try {
        const progress = await getCourseProgress({
          courseIdOrSlug: item.id,
          userId,
        });
        return [item.id, progress] as const;
      } catch {
        return [item.id, null] as const;
      }
    }),
  );

  for (const [courseId, progress] of results) {
    if (progress) {
      progressMap.set(courseId, progress);
    }
  }

  return progressMap;
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

  const progressMap = await fetchEnrolledProgressMap(
    publicResult.items,
    enrolledCourseIds,
    viewer.id,
  );

  return {
    courses: mergeUserSignals(
      publicResult.items,
      cartCourseIds,
      enrolledCourseIds,
      progressMap,
    ),
    pagination: publicResult.pagination,
  };
}
