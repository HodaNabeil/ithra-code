import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

import {
  AskTutorError,
  AskTutorErrorCodes,
} from '../../application/errors/ask-tutor.errors';
import { AITutorConfig } from '../config/ai-tutor.config';

const MESSAGE_RATE_PREFIX = 'rate:tutor-messages';
const ACTIVE_STREAM_PREFIX = 'tutor:active-streams';

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

function throwServiceUnavailable(guard: 'rate_limit' | 'stream_slot', userId: string): never {
  logger.error({ userId, guard }, '[TUTOR_GUARD_REDIS_FAILURE]');
  throw new AskTutorError(
    503,
    'خدمة المدرس الذكي غير متاحة مؤقتاً. حاول مرة أخرى بعد قليل.',
    AskTutorErrorCodes.SERVICE_UNAVAILABLE,
  );
}

/**
 * Per-student message rate limits: minute, hour, and day windows.
 * Redis failures fail closed to prevent unbounded LLM usage.
 */
export async function checkTutorMessageRateLimit(userId: string): Promise<void> {
  const limits = AITutorConfig.getRateLimitConfig();

  try {
    const minuteCount = await incrementWindow(
      `${MESSAGE_RATE_PREFIX}:minute:${userId}`,
      60,
    );

    if (minuteCount > limits.messagesPerMinute) {
      throw new AskTutorError(
        429,
        'تم تجاوز حد الرسائل في الدقيقة. حاول مرة أخرى بعد قليل.',
        AskTutorErrorCodes.RATE_LIMIT_EXCEEDED,
      );
    }

    const hourCount = await incrementWindow(
      `${MESSAGE_RATE_PREFIX}:hour:${userId}`,
      3600,
    );

    if (hourCount > limits.messagesPerHour) {
      throw new AskTutorError(
        429,
        'تم تجاوز حد الرسائل في الساعة. حاول مرة أخرى لاحقاً.',
        AskTutorErrorCodes.RATE_LIMIT_EXCEEDED,
      );
    }

    const dayCount = await incrementWindow(
      `${MESSAGE_RATE_PREFIX}:day:${userId}`,
      86_400,
    );

    if (dayCount > limits.messagesPerDay) {
      throw new AskTutorError(
        429,
        'تم تجاوز حد الرسائل اليومي. حاول مرة أخرى غداً.',
        AskTutorErrorCodes.RATE_LIMIT_EXCEEDED,
      );
    }
  } catch (error) {
    if (error instanceof AskTutorError) {
      throw error;
    }

    throwServiceUnavailable('rate_limit', userId);
  }
}

/**
 * Limits concurrent SSE streams per student.
 * Returns a release function that must be called when the stream ends.
 */
export async function acquireTutorStreamSlot(
  userId: string,
): Promise<() => Promise<void>> {
  const { maxConcurrentStreamsPerUser, requestTimeoutMs } =
    AITutorConfig.getStreamConfig();
  const key = `${ACTIVE_STREAM_PREFIX}:${userId}`;

  try {
    const activeCount = await redis.incr(key);

    if (activeCount > maxConcurrentStreamsPerUser) {
      await redis.decr(key);
      throw new AskTutorError(
        429,
        'لديك محادثة نشطة بالفعل. انتظر حتى تنتهي المحادثة الحالية.',
        AskTutorErrorCodes.CONCURRENT_STREAM_LIMIT,
      );
    }

    const ttlSeconds = Math.ceil(requestTimeoutMs / 1000) + 10;
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
        logger.error({ userId, guard: 'stream_slot', error }, '[TUTOR_STREAM_LIMIT_RELEASE]');
      }
    };
  } catch (error) {
    if (error instanceof AskTutorError) {
      throw error;
    }

    throwServiceUnavailable('stream_slot', userId);
  }
}
