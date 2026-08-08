import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

import { PlatformError, PlatformErrorCodes } from '../../shared/errors';
import { AI_PLATFORM_CONSTANTS } from '../../shared/constants';

export type ConcurrencySlotOptions = {
  userId: string;
  maxConcurrent: number;
  timeoutMs: number;
  scope?: string;
};

/**
 * Limits concurrent SSE streams per user.
 * Returns a release function that must be called when the stream ends.
 */
export async function acquireConcurrencySlot(
  options: ConcurrencySlotOptions,
): Promise<() => Promise<void>> {
  const scope = options.scope ?? 'streams';
  const key = `${AI_PLATFORM_CONSTANTS.KEY_PREFIX_ACTIVE_STREAMS}${scope}:${options.userId}`;

  try {
    const activeCount = await redis.incr(key);

    if (activeCount > options.maxConcurrent) {
      await redis.decr(key);
      throw new PlatformError(
        PlatformErrorCodes.CONCURRENCY_LIMIT,
        'لديك محادثة نشطة بالفعل. انتظر حتى تنتهي المحادثة الحالية.',
      );
    }

    const ttlSeconds = Math.ceil(options.timeoutMs / 1000) + 10;
    await redis.expire(key, ttlSeconds);

    let released = false;

    return async () => {
      if (released) {
        return;
      }

      released = true;

      try {
        const remaining = await redis.decr(key);
        if (remaining <= 0) {
          await redis.del(key);
        }
      } catch (error) {
        logger.error({ userId: options.userId, guard: 'stream_slot', error }, '[AI_STREAM_LIMIT_RELEASE]');
      }
    };
  } catch (error) {
    if (error instanceof PlatformError) {
      throw error;
    }

    logger.error({ userId: options.userId, guard: 'stream_slot' }, '[AI_STREAM_LIMIT_REDIS_FAILURE]');
    throw new PlatformError(
      PlatformErrorCodes.PROVIDER_UNAVAILABLE,
      'خدمة الذكاء الاصطناعي غير متاحة مؤقتاً. حاول مرة أخرى بعد قليل.',
      true,
    );
  }
}
