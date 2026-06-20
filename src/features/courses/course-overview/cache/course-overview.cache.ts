import { redis } from '@/lib/redis';
import type {
  CourseOverviewCacheScope,
  CourseOverviewDTO,
} from '../dto/course-overview.dto';

const CACHE_PREFIX = 'course:overview:v2';
const CACHE_TTL_SECONDS = 300;

function buildCacheKey(
  idOrSlug: string,
  scope: CourseOverviewCacheScope,
): string {
  return `${CACHE_PREFIX}:${idOrSlug}:${scope}`;
}

export const courseOverviewCache = {
  async get(
    idOrSlug: string,
    scope: CourseOverviewCacheScope,
  ): Promise<CourseOverviewDTO | null> {
    try {
      const raw = await redis.get(buildCacheKey(idOrSlug, scope));
      if (!raw) return null;
      return JSON.parse(raw) as CourseOverviewDTO;
    } catch (error) {
      console.error('[COURSE_OVERVIEW_CACHE_GET]', error);
      return null;
    }
  },

  async set(
    idOrSlug: string,
    scope: CourseOverviewCacheScope,
    overview: CourseOverviewDTO,
  ): Promise<void> {
    try {
      await redis.set(
        buildCacheKey(idOrSlug, scope),
        JSON.stringify(overview),
        'EX',
        CACHE_TTL_SECONDS,
      );
    } catch (error) {
      console.error('[COURSE_OVERVIEW_CACHE_SET]', error);
    }
  },

  async invalidate(idOrSlug: string): Promise<void> {
    try {
      await Promise.all([
        redis.del(buildCacheKey(idOrSlug, 'public')),
        redis.del(buildCacheKey(idOrSlug, 'staff')),
      ]);
    } catch (error) {
      console.error('[COURSE_OVERVIEW_CACHE_INVALIDATE]', error);
    }
  },
};
