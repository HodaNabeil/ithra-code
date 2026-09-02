import { ZodError } from 'zod';
import { courseSectionsCache } from '../cache/course-sections.cache';
import type {
  CourseSectionsProgressRecord,
  CourseSectionsViewer,
  GetCourseSectionsResponse,
} from '../dto/course-sections.dto';
import {
  CourseSectionsError,
  courseNotFoundMessage,
} from '../errors/course-sections.errors';
import {
  buildProgressMap,
  mapCourseSectionsToDTO,
} from '../mapper/course-sections.mapper';
import {
  assertCourseSectionsAccessible,
  resolveCacheScope,
  resolvePublishedOnly,
} from '../policies/course-access.policy';
import {
  courseSectionsRepository,
  isProgressEligibleEnrollment,
  type CourseSectionsRepository,
} from '../repository/course-sections.repository';
import { parseCourseSectionsParams } from '../validation/course-sections.validation';

export type GetCourseSectionsInput = {
  courseIdOrSlug: string;
  user?: CourseSectionsViewer;
};

export async function getCourseSections(
  input: GetCourseSectionsInput,
  repository: CourseSectionsRepository = courseSectionsRepository,
): Promise<GetCourseSectionsResponse> {
  let courseIdOrSlug: string;

  try {
    ({ courseIdOrSlug } = parseCourseSectionsParams({
      courseIdOrSlug: input.courseIdOrSlug,
    }));
  } catch (error) {
    if (error instanceof ZodError) {
      throw new CourseSectionsError(
        400,
        error.issues[0]?.message ?? 'Invalid request',
      );
    }
    throw error;
  }

  const viewer = input.user ?? null;
  const course = await repository.findCourseIdentity(courseIdOrSlug);

  if (!course) {
    throw new CourseSectionsError(
      404,
      courseNotFoundMessage(courseIdOrSlug),
      'COURSE_NOT_FOUND',
    );
  }

  assertCourseSectionsAccessible(course, courseIdOrSlug, viewer);

  const publishedOnly = resolvePublishedOnly(course, viewer);
  const cacheScope = resolveCacheScope(course, viewer);

  if (!viewer?.id) {
    const cached = await courseSectionsCache.get(courseIdOrSlug, cacheScope);
    if (cached) {
      return cached;
    }
  }

  const courseWithSections = await repository.findSectionsWithLectures(
    course.id,
    { publishedOnly },
  );

  if (!courseWithSections) {
    throw new CourseSectionsError(
      404,
      courseNotFoundMessage(courseIdOrSlug),
      'COURSE_NOT_FOUND',
    );
  }

  let includeProgress = false;
  let progressByLectureId = new Map<string, CourseSectionsProgressRecord>();

  if (viewer?.id) {
    const enrollment = await repository.findEnrollment(viewer.id, course.id);

    if (enrollment && isProgressEligibleEnrollment(enrollment)) {
      includeProgress = true;
      const progressRecords = await repository.findProgressByEnrollment(
        enrollment.id,
      );
      progressByLectureId = buildProgressMap(progressRecords);
    }
  }

  const data = mapCourseSectionsToDTO({
    course: courseWithSections,
    progressByLectureId,
    includeProgress,
  });

  if (!viewer?.id) {
    await courseSectionsCache.set(courseIdOrSlug, cacheScope, data);
  }

  return data;
}
