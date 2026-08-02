import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

import {
  AskTutorError,
  AskTutorErrorCodes,
} from '../../application/errors/ask-tutor.errors';
import { AITutorConfig } from '../config/ai-tutor.config';

const DAILY_COST_PREFIX = 'tutor:daily-cost';

function getDailyCostKey(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${DAILY_COST_PREFIX}:${date}`;
}

/**
 * Increments a coarse daily request counter used as a spend guard.
 * Fails closed when Redis is unavailable.
 */
export async function checkTutorDailyCostCap(): Promise<void> {
  const cap = AITutorConfig.getDailyCostCap();
  if (!cap || cap <= 0) {
    return;
  }

  const key = getDailyCostKey();

  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, 86_400);
    }

    if (count > cap) {
      throw new AskTutorError(
        503,
        'تم تجاوز الحد اليومي لاستخدام المدرس الذكي. حاول مرة أخرى غداً.',
        AskTutorErrorCodes.SERVICE_UNAVAILABLE,
      );
    }
  } catch (error) {
    if (error instanceof AskTutorError) {
      throw error;
    }

    logger.error({ error }, '[TUTOR_COST_CAP_REDIS_FAILURE]');
    throw new AskTutorError(
      503,
      'خدمة المدرس الذكي غير متاحة مؤقتاً. حاول مرة أخرى بعد قليل.',
      AskTutorErrorCodes.SERVICE_UNAVAILABLE,
    );
  }
}
