import { cache } from '@/lib/cache';
import { COURSE_TAGS } from '@/lib/query-keys';
import { auth } from '@/lib/auth';
import type { LoadCourseDetailResult } from '@/types/course/course.types';
import {
  COURSE_NOT_FOUND_MESSAGE,
  CourseDetailError,
} from '../errors/course-detail.errors';
import { mapCourseDetailEntityToPageDTO } from '../mapper/to-page-dto';
import { mapCourseDetailEntityToPublicDTO } from '../mapper/to-api-dto';
import { assertCourseVisible } from '../policies/course-visibility.policy';
import {
  courseDetailRepository,
} from '../repository/course-detail.repository';
import type { DB_CourseDetailEntity } from '../repository/course-detail.select';

const loadCourseDetailEntityCached = cache(
  async (slug: string): Promise<DB_CourseDetailEntity | null> =>
    courseDetailRepository.findCourseBySlug(slug),
  (slug) => [...COURSE_TAGS.course.detail(slug)],
  {
    tags: [...COURSE_TAGS.course.details()],
    revalidate: 60,
  },
);

function isNextNotFoundError(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'digest' in error &&
    String((error as { digest?: string }).digest).startsWith('NEXT_NOT_FOUND'),
  );
}

function isCourseNotFoundError(error: unknown): boolean {
  return (
    error instanceof CourseDetailError ||
    (error instanceof Error && error.message === COURSE_NOT_FOUND_MESSAGE)
  );
}

/** SSR page use-case: Next.js cache + visibility + page DTO. */
export async function loadCourseDetailPage(slug: string) {
  const session = await auth();
  const user = session?.user?.id
    ? { id: session.user.id, role: session.user.role }
    : null;

  const entity = await loadCourseDetailEntityCached(slug);
  if (!entity) {
    throw new CourseDetailError(404, COURSE_NOT_FOUND_MESSAGE, 'COURSE_NOT_FOUND');
  }

  assertCourseVisible(mapCourseDetailEntityToPublicDTO(entity), user);

  return mapCourseDetailEntityToPageDTO(entity);
}

export async function loadCourseDetailBySlug(
  slug: string,
): Promise<LoadCourseDetailResult> {
  try {
    const course = await loadCourseDetailPage(slug);
    return { status: 'ok', course };
  } catch (error: unknown) {
    if (isNextNotFoundError(error)) {
      throw error;
    }
    if (isCourseNotFoundError(error)) {
      return { status: 'not_found' };
    }
    return { status: 'error', error };
  }
}
