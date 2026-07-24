import { redis } from '@/lib/redis';
import type { ProviderRateLimiter } from '@/features/payments/application/ports/provider-rate-limiter';

/**
 * Redis-backed per-provider token bucket for reconcile inquiry rate limiting.
 */
export class RedisProviderRateLimiter implements ProviderRateLimiter {
  constructor(
    private readonly maxPerMinute: number,
    private readonly keyPrefix = 'payment:reconcile:rate',
  ) {}

  async acquire(
    provider: import('@/features/payments/domain').PaymentProvider,
  ): Promise<void> {
    const windowKey = `${this.keyPrefix}:${provider}:${Math.floor(Date.now() / 60_000)}`;
    const count = await redis.incr(windowKey);

    if (count === 1) {
      await redis.expire(windowKey, 120);
    }

    if (count > this.maxPerMinute) {
      const ttlMs = await redis.pttl(windowKey);
      const waitMs = Math.max(100, ttlMs > 0 ? ttlMs : 60_000);
      await sleep(waitMs);
      return this.acquire(provider);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
