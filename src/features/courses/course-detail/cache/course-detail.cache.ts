import { redis } from '@/lib/redis';
import type { CourseDetailPublicDTO } from '../dto/course-detail.dto';

const CACHE_PREFIX = 'course:detail:v1';
const CACHE_TTL_SECONDS = 300;

function buildCacheKey(slug: string): string {
  return `${CACHE_PREFIX}:${slug}`;
}

export const courseDetailCache = {
  async get(slug: string): Promise<CourseDetailPublicDTO | null> {
    try {
      const raw = await redis.get(buildCacheKey(slug));
      if (!raw) return null;
      return JSON.parse(raw) as CourseDetailPublicDTO;
    } catch (error) {
      console.error('[COURSE_DETAIL_CACHE_GET]', error);
      return null;
    }
  },

  async set(slug: string, dto: CourseDetailPublicDTO): Promise<void> {
    try {
      await redis.set(
        buildCacheKey(slug),
        JSON.stringify(dto),
        'EX',
        CACHE_TTL_SECONDS,
      );
    } catch (error) {
      console.error('[COURSE_DETAIL_CACHE_SET]', error);
    }
  },

  async invalidate(slug: string): Promise<void> {
    try {
      await redis.del(buildCacheKey(slug));
    } catch (error) {
      console.error('[COURSE_DETAIL_CACHE_INVALIDATE]', error);
    }
  },
};
