import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

import { PlatformError, PlatformErrorCodes } from '../../shared/errors';
import { AI_PLATFORM_CONSTANTS } from '../../shared/constants';
import { platformMetrics } from '../../observability/metrics/platform-metrics';

export type RateLimitWindows = {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
};

export type MessageRateLimitOptions = {
  userId: string;
  limits: RateLimitWindows;
  scope?: string;
};

async function incrementWindow(key: string, windowSeconds: number): Promise<number> {
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }

  return count;
}

/**
 * Per-user message rate limits across minute, hour, and day windows.
 * Redis failures fail closed to prevent unbounded LLM usage.
 */
export async function assertMessageRateLimit(options: MessageRateLimitOptions): Promise<void> {
  const scope = options.scope ?? 'messages';
  const prefix = AI_PLATFORM_CONSTANTS.KEY_PREFIX_RATE;

  try {
    const minuteCount = await incrementWindow(
      `${prefix}${scope}:minute:${options.userId}`,
      60,
    );

    if (minuteCount > options.limits.requestsPerMinute) {
      platformMetrics.incrementRateLimitRejected(`${scope}:minute`);
      throw new PlatformError(
        PlatformErrorCodes.RATE_LIMITED,
        'تم تجاوز حد الرسائل في الدقيقة. حاول مرة أخرى بعد قليل.',
      );
    }

    const hourCount = await incrementWindow(
      `${prefix}${scope}:hour:${options.userId}`,
      3600,
    );

    if (hourCount > options.limits.requestsPerHour) {
      platformMetrics.incrementRateLimitRejected(`${scope}:hour`);
      throw new PlatformError(
        PlatformErrorCodes.RATE_LIMITED,
        'تم تجاوز حد الرسائل في الساعة. حاول مرة أخرى لاحقاً.',
      );
    }

    const dayCount = await incrementWindow(
      `${prefix}${scope}:day:${options.userId}`,
      86_400,
    );

    if (dayCount > options.limits.requestsPerDay) {
      platformMetrics.incrementRateLimitRejected(`${scope}:day`);
      throw new PlatformError(
        PlatformErrorCodes.RATE_LIMITED,
        'تم تجاوز حد الرسائل اليومي. حاول مرة أخرى غداً.',
      );
    }
  } catch (error) {
    if (error instanceof PlatformError) {
      throw error;
    }

    logger.error({ userId: options.userId, guard: 'rate_limit' }, '[AI_RATE_LIMIT_REDIS_FAILURE]');
    platformMetrics.incrementRedisGuardFailure('rate_limit');
    throw new PlatformError(
      PlatformErrorCodes.PROVIDER_UNAVAILABLE,
      'خدمة الذكاء الاصطناعي غير متاحة مؤقتاً. حاول مرة أخرى بعد قليل.',
      true,
    );
  }
}
