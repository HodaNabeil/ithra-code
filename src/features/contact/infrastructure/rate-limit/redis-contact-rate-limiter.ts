import { redis } from '@/lib/redis';
import type { ContactRateLimiter } from '../../application/ports/contact-rate-limiter.port';
import {
  ContactError,
  CONTACT_ERROR_CODES,
} from '../../domain/errors/contact.errors';

const CONTACT_IP_PREFIX = 'rate:contact:ip';
const CONTACT_IP_MAX = 5;
const CONTACT_IP_WINDOW_SECONDS = 15 * 60;

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

export class RedisContactRateLimiter implements ContactRateLimiter {
  async check(ip: string | null): Promise<void> {
    if (!ip) {
      return;
    }

    try {
      const count = await incrementWindow(
        `${CONTACT_IP_PREFIX}:${ip}`,
        CONTACT_IP_WINDOW_SECONDS,
      );

      if (count > CONTACT_IP_MAX) {
        throw new ContactError(
          429,
          'تم تجاوز عدد الطلبات المسموح بها. يرجى المحاولة لاحقاً.',
          CONTACT_ERROR_CODES.RATE_LIMIT_EXCEEDED,
        );
      }
    } catch (error) {
      if (error instanceof ContactError) {
        throw error;
      }
    }
  }
}

export const redisContactRateLimiter = new RedisContactRateLimiter();

export async function checkContactRateLimit(ip: string | null): Promise<void> {
  return redisContactRateLimiter.check(ip);
}
