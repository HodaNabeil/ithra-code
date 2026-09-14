import { redis } from '@/lib/redis';
import { getClientIp } from '@/features/payments/infrastructure/http/rate-limit';
import { EnrollmentError } from '../../application/errors/enrollment.errors';

const ENROLL_USER_PREFIX = 'rate:free-enroll:user';
const ENROLL_IP_PREFIX = 'rate:free-enroll:ip';

const ENROLL_USER_MAX = 10;
const ENROLL_USER_WINDOW_SECONDS = 60;
const ENROLL_IP_MAX = 20;
const ENROLL_IP_WINDOW_SECONDS = 60;

async function incrementWindow(
  key: string,
  windowSeconds: number,
): Promise<number> {
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }
  return count;
}

/**
 * Free-enrollment abuse protection: 10 req/user/min and 20 req/IP/min.
 * Redis failures are swallowed so rate limiting never blocks legitimate enrollments.
 */
export async function checkFreeEnrollRateLimit(input: {
  userId: string;
  ip: string | null;
}): Promise<void> {
  try {
    const userCount = await incrementWindow(
      `${ENROLL_USER_PREFIX}:${input.userId}`,
      ENROLL_USER_WINDOW_SECONDS,
    );

    if (userCount > ENROLL_USER_MAX) {
      throw new EnrollmentError(
        429,
        'تم تجاوز حد طلبات التسجيل. حاول مرة أخرى لاحقاً',
        'RATE_LIMIT_EXCEEDED',
      );
    }

    if (input.ip) {
      const ipCount = await incrementWindow(
        `${ENROLL_IP_PREFIX}:${input.ip}`,
        ENROLL_IP_WINDOW_SECONDS,
      );

      if (ipCount > ENROLL_IP_MAX) {
        throw new EnrollmentError(
          429,
          'تم تجاوز حد طلبات التسجيل. حاول مرة أخرى لاحقاً',
          'RATE_LIMIT_EXCEEDED',
        );
      }
    }
  } catch (error) {
    if (error instanceof EnrollmentError) {
      throw error;
    }
  }
}

export { getClientIp };
