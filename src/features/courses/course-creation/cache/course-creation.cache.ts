import { redis } from '@/lib/redis';

const COURSE_LIST_CACHE_PREFIX = 'course:list:v1';

/** Scans and deletes all course list cache keys after creation. */
export async function invalidateCourseListCache(): Promise<void> {
  try {
    let cursor = '0';

    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        'MATCH',
        `${COURSE_LIST_CACHE_PREFIX}:*`,
        'COUNT',
        100,
      );

      cursor = nextCursor;

      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== '0');
  } catch (error) {
    console.error('[COURSE_LIST_CACHE_INVALIDATE]', error);
  }
}
