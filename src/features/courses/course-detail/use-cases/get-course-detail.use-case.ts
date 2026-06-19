import { courseDetailCache } from '../cache/course-detail.cache';
import type {
  CourseDetailApiDTO,
  CourseDetailPublicDTO,
} from '../dto/course-detail.dto';
import {
  COURSE_NOT_FOUND_MESSAGE,
  CourseDetailError,
} from '../errors/course-detail.errors';
import { mapCourseDetailEntityToPublicDTO } from '../mapper/to-api-dto';
import {
  assertCourseVisible,
  type CourseVisibilityUser,
} from '../policies/course-visibility.policy';
import {
  courseDetailRepository,
  type CourseDetailRepository,
} from '../repository/course-detail.repository';

export type CourseDetailUser = CourseVisibilityUser;

export type GetCourseDetailInput = {
  slug: string;
  user?: CourseDetailUser | null;
};

async function loadPublicCourse(
  slug: string,
  repository: CourseDetailRepository,
): Promise<CourseDetailPublicDTO> {
  const cached = await courseDetailCache.get(slug);
  if (cached) return cached;

  const entity = await repository.findCourseBySlug(slug);
  if (!entity) {
    throw new CourseDetailError(404, COURSE_NOT_FOUND_MESSAGE, 'COURSE_NOT_FOUND');
  }

  const publicDto = mapCourseDetailEntityToPublicDTO(entity);
  await courseDetailCache.set(slug, publicDto);
  return publicDto;
}

function withDefaultUserFields(
  course: CourseDetailPublicDTO,
): CourseDetailApiDTO {
  return {
    ...course,
    isPurchased: false,
    isInCart: false,
    enrollmentStatus: null,
  };
}

/** API use-case: Redis cache + visibility + user signals. */
export async function getCourseDetail(
  input: GetCourseDetailInput,
  repository: CourseDetailRepository = courseDetailRepository,
): Promise<CourseDetailApiDTO> {
  const { slug, user } = input;
  const publicDto = await loadPublicCourse(slug, repository);

  assertCourseVisible(publicDto, user);

  if (!user?.id) {
    return withDefaultUserFields(publicDto);
  }

  const signals = await repository.findUserSignals(user.id, publicDto.id);

  return {
    ...publicDto,
    isPurchased: signals.isPurchased,
    isInCart: signals.isInCart,
    enrollmentStatus: signals.enrollmentStatus,
  };
}
