import { redis } from '@/lib/redis';
import { CheckoutError } from '@/features/payments/application';
import type { CheckoutLock } from '@/features/payments/application/ports/checkout-lock';

const LOCK_PREFIX = 'checkout:lock';
const LOCK_TTL_SECONDS = 120;

/**
 * Redis-backed checkout lock. Fail-close: Redis errors reject checkout (503).
 */
export class RedisCheckoutLock implements CheckoutLock {
  async acquire(userId: string): Promise<void> {
    try {
      const result = await redis.set(
        `${LOCK_PREFIX}:${userId}`,
        '1',
        'EX',
        LOCK_TTL_SECONDS,
        'NX',
      );

      if (result !== 'OK') {
        throw new CheckoutError(
          409,
          'عملية دفع قيد التنفيذ بالفعل',
          'CHECKOUT_IN_PROGRESS',
        );
      }
    } catch (error) {
      if (error instanceof CheckoutError) {
        throw error;
      }

      throw new CheckoutError(
        503,
        'تعذر بدء عملية الدفع حالياً',
        'CHECKOUT_LOCK_UNAVAILABLE',
      );
    }
  }

  async extend(userId: string): Promise<void> {
    try {
      await redis.expire(`${LOCK_PREFIX}:${userId}`, LOCK_TTL_SECONDS);
    } catch {
      // Best-effort; lock still expires via original TTL.
    }
  }

  async release(userId: string): Promise<void> {
    try {
      await redis.del(`${LOCK_PREFIX}:${userId}`);
    } catch {
      // Best-effort release; lock expires via TTL.
    }
  }
}

export const redisCheckoutLock = new RedisCheckoutLock();
