import { redis } from '@/lib/redis';
import type {
  CourseSectionsCacheScope,
  GetCourseSectionsResponse,
} from '../dto/course-sections.dto';

const CACHE_PREFIX = 'course:sections:v1';
const CACHE_TTL_SECONDS = 300;

function buildCacheKey(
  idOrSlug: string,
  scope: CourseSectionsCacheScope,
): string {
  return `${CACHE_PREFIX}:${idOrSlug}:${scope}`;
}

export const courseSectionsCache = {
  async get(
    idOrSlug: string,
    scope: CourseSectionsCacheScope,
  ): Promise<GetCourseSectionsResponse | null> {
    try {
      const raw = await redis.get(buildCacheKey(idOrSlug, scope));
      if (!raw) return null;
      return JSON.parse(raw) as GetCourseSectionsResponse;
    } catch (error) {
      console.error('[COURSE_SECTIONS_CACHE_GET]', error);
      return null;
    }
  },

  async set(
    idOrSlug: string,
    scope: CourseSectionsCacheScope,
    data: GetCourseSectionsResponse,
  ): Promise<void> {
    try {
      await redis.set(
        buildCacheKey(idOrSlug, scope),
        JSON.stringify(data),
        'EX',
        CACHE_TTL_SECONDS,
      );
    } catch (error) {
      console.error('[COURSE_SECTIONS_CACHE_SET]', error);
    }
  },

  async invalidate(idOrSlug: string): Promise<void> {
    try {
      await Promise.all([
        redis.del(buildCacheKey(idOrSlug, 'public')),
        redis.del(buildCacheKey(idOrSlug, 'staff')),
      ]);
    } catch (error) {
      console.error('[COURSE_SECTIONS_CACHE_INVALIDATE]', error);
    }
  },
};
