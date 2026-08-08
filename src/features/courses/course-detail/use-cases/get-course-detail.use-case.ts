import { isCuid } from '@/features/courses/lib/is-cuid';
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
  idOrSlug: string;
  user?: CourseDetailUser | null;
};

async function loadPublicCourse(
  idOrSlug: string,
  repository: CourseDetailRepository,
): Promise<CourseDetailPublicDTO> {
  const cached = isCuid(idOrSlug) ? null : await courseDetailCache.get(idOrSlug);
  if (cached) return cached;

  const entity = await repository.findCourseByIdOrSlug(idOrSlug);
  if (!entity) {
    throw new CourseDetailError(404, COURSE_NOT_FOUND_MESSAGE, 'COURSE_NOT_FOUND');
  }

  const publicDto = mapCourseDetailEntityToPublicDTO(entity);
  await courseDetailCache.set(entity.slug, publicDto);
  return publicDto;
}

function withDefaultUserFields(
  course: CourseDetailPublicDTO,
): CourseDetailApiDTO {
  return {
    ...course,
    isPurchased: false,
    isInCart: false,
  };
}

/** API use-case: Redis cache + visibility + user signals. */
export async function getCourseDetail(
  input: GetCourseDetailInput,
  repository: CourseDetailRepository = courseDetailRepository,
): Promise<CourseDetailApiDTO> {
  const { idOrSlug, user } = input;
  const publicDto = await loadPublicCourse(idOrSlug, repository);

  assertCourseVisible(publicDto, user);

  if (!user?.id) {
    return withDefaultUserFields(publicDto);
  }

  const signals = await repository.findUserSignals(user.id, publicDto.id);

  return {
    ...publicDto,
    isPurchased: signals.isPurchased,
    isInCart: signals.isInCart,
  };
}
