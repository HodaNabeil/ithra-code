import { redis } from '@/lib/redis';
import type {
  CourseSectionsCacheScope,
  GetCourseSectionsResponse,
} from '../dto/course-sections.dto';

const CACHE_PREFIX = 'course:sections:v1';
const CACHE_TTL_SECONDS = 300;

function buildCacheKey(
  courseIdOrSlug: string,
  scope: CourseSectionsCacheScope,
): string {
  return `${CACHE_PREFIX}:${courseIdOrSlug}:${scope}`;
}

export const courseSectionsCache = {
  async get(
    courseIdOrSlug: string,
    scope: CourseSectionsCacheScope,
  ): Promise<GetCourseSectionsResponse | null> {
    try {
      const raw = await redis.get(buildCacheKey(courseIdOrSlug, scope));
      if (!raw) return null;
      return JSON.parse(raw) as GetCourseSectionsResponse;
    } catch (error) {
      console.error('[COURSE_SECTIONS_CACHE_GET]', error);
      return null;
    }
  },

  async set(
    courseIdOrSlug: string,
    scope: CourseSectionsCacheScope,
    data: GetCourseSectionsResponse,
  ): Promise<void> {
    try {
      await redis.set(
        buildCacheKey(courseIdOrSlug, scope),
        JSON.stringify(data),
        'EX',
        CACHE_TTL_SECONDS,
      );
    } catch (error) {
      console.error('[COURSE_SECTIONS_CACHE_SET]', error);
    }
  },

  async invalidate(courseIdOrSlug: string): Promise<void> {
    try {
      await Promise.all([
        redis.del(buildCacheKey(courseIdOrSlug, 'public')),
        redis.del(buildCacheKey(courseIdOrSlug, 'staff')),
      ]);
    } catch (error) {
      console.error('[COURSE_SECTIONS_CACHE_INVALIDATE]', error);
    }
  },
};
