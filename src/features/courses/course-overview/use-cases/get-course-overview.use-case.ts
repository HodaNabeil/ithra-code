import { ZodError } from 'zod';
import { courseOverviewCache } from '../cache/course-overview.cache';
import type { GetCourseOverviewResponse } from '../dto/course-overview.dto';
import {
  COURSE_NOT_FOUND_MESSAGE,
  CourseOverviewError,
} from '../errors/course-overview.errors';
import {
  mapCourseOverviewRecordToDTO,
  mergeIdentityAndAggregates,
} from '../mapper/course-overview.mapper';
import {
  assertCourseOverviewVisible,
  resolveCacheScope,
  type CourseOverviewViewer,
} from '../policies/course-visibility.policy';
import {
  courseOverviewRepository,
  type CourseOverviewRepository,
} from '../repository/course-overview.repository';
import { parseCourseOverviewParams } from '../validation/course-overview.validation';

export type GetCourseOverviewInput = {
  idOrSlug: string;
  user?: CourseOverviewViewer;
};

export async function getCourseOverview(
  input: GetCourseOverviewInput,
  repository: CourseOverviewRepository = courseOverviewRepository,
): Promise<GetCourseOverviewResponse> {
  let idOrSlug: string;

  try {
    ({ idOrSlug } = parseCourseOverviewParams({ idOrSlug: input.idOrSlug }));
  } catch (error) {
    if (error instanceof ZodError) {
      throw new CourseOverviewError(
        400,
        error.issues[0]?.message ?? 'Invalid request',
      );
    }
    throw error;
  }

  const course = await repository.findCourseIdentity(idOrSlug);
  if (!course) {
    throw new CourseOverviewError(
      404,
      COURSE_NOT_FOUND_MESSAGE,
      'COURSE_NOT_FOUND',
    );
  }

  assertCourseOverviewVisible(course, input.user ?? null);

  const cacheScope = resolveCacheScope(course, input.user ?? null);
  const cached = await courseOverviewCache.get(idOrSlug, cacheScope);
  if (cached) {
    return { overview: cached };
  }

  const aggregates = await repository.getAggregates(course.id, {
    publishedLecturesOnly: cacheScope === 'public',
  });

  const overview = mapCourseOverviewRecordToDTO(
    mergeIdentityAndAggregates(course, aggregates),
  );

  await courseOverviewCache.set(idOrSlug, cacheScope, overview);

  return { overview };
}
