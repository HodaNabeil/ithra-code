import { redis } from '@/lib/redis';
import type {
  CourseOverviewCacheScope,
  CourseOverviewDTO,
} from '../dto/course-overview.dto';

const CACHE_PREFIX = 'course:overview:v2';
const CACHE_TTL_SECONDS = 300;

function buildCacheKey(
  courseIdOrSlug: string,
  scope: CourseOverviewCacheScope,
): string {
  return `${CACHE_PREFIX}:${courseIdOrSlug}:${scope}`;
}

export const courseOverviewCache = {
  async get(
    courseIdOrSlug: string,
    scope: CourseOverviewCacheScope,
  ): Promise<CourseOverviewDTO | null> {
    try {
      const raw = await redis.get(buildCacheKey(courseIdOrSlug, scope));
      if (!raw) return null;
      return JSON.parse(raw) as CourseOverviewDTO;
    } catch (error) {
      console.error('[COURSE_OVERVIEW_CACHE_GET]', error);
      return null;
    }
  },

  async set(
    courseIdOrSlug: string,
    scope: CourseOverviewCacheScope,
    overview: CourseOverviewDTO,
  ): Promise<void> {
    try {
      await redis.set(
        buildCacheKey(courseIdOrSlug, scope),
        JSON.stringify(overview),
        'EX',
        CACHE_TTL_SECONDS,
      );
    } catch (error) {
      console.error('[COURSE_OVERVIEW_CACHE_SET]', error);
    }
  },

  async invalidate(courseIdOrSlug: string): Promise<void> {
    try {
      await Promise.all([
        redis.del(buildCacheKey(courseIdOrSlug, 'public')),
        redis.del(buildCacheKey(courseIdOrSlug, 'staff')),
      ]);
    } catch (error) {
      console.error('[COURSE_OVERVIEW_CACHE_INVALIDATE]', error);
    }
  },
};
