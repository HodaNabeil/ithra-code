import { redis } from '@/lib/redis';
import { CourseCreationError } from '../errors/course-creation.errors';

const RATE_LIMIT_PREFIX = 'rate:course-create';
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_SECONDS = 3600;

function buildRateLimitKey(userId: string): string {
  return `${RATE_LIMIT_PREFIX}:${userId}`;
}

/** Redis sliding-window rate limiter: 5 course creations per hour per user. */
export async function checkCourseCreationRateLimit(
  userId: string,
): Promise<void> {
  const key = buildRateLimitKey(userId);

  try {
    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, RATE_LIMIT_WINDOW_SECONDS);
    }

    if (count > RATE_LIMIT_MAX) {
      throw new CourseCreationError(
        429,
        'Course creation rate limit exceeded. Try again later.',
        'COURSE_CREATE_RATE_LIMIT',
      );
    }
  } catch (error) {
    if (error instanceof CourseCreationError) {
      throw error;
    }

    console.error('[COURSE_CREATE_RATE_LIMIT]', error);
  }
}
