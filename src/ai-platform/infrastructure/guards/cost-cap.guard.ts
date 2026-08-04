import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

import { PlatformError, PlatformErrorCodes } from '../../shared/errors';
import { AI_PLATFORM_CONSTANTS } from '../../shared/constants';

function getDailyCostKey(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${AI_PLATFORM_CONSTANTS.KEY_PREFIX_DAILY_COST}${date}`;
}

/**
 * Increments a coarse global daily request counter used as a spend guard.
 * Fails closed when Redis is unavailable.
 */
export async function assertGlobalDailyCostCap(dailyCap: number): Promise<void> {
  if (!dailyCap || dailyCap <= 0) {
    return;
  }

  const key = getDailyCostKey();

  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, 86_400);
    }

    if (count > dailyCap) {
      throw new PlatformError(
        PlatformErrorCodes.COST_CAP_EXCEEDED,
        'تم تجاوز الحد اليومي لاستخدام الذكاء الاصطناعي. حاول مرة أخرى غداً.',
      );
    }
  } catch (error) {
    if (error instanceof PlatformError) {
      throw error;
    }

    logger.error({ error }, '[AI_COST_CAP_REDIS_FAILURE]');
    throw new PlatformError(
      PlatformErrorCodes.PROVIDER_UNAVAILABLE,
      'خدمة الذكاء الاصطناعي غير متاحة مؤقتاً. حاول مرة أخرى بعد قليل.',
      true,
    );
  }
}
