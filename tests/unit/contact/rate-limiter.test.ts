import Redis from 'ioredis-mock';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RedisContactRateLimiter } from '@/features/contact/infrastructure/rate-limit/redis-contact-rate-limiter';
import {
  ContactError,
  CONTACT_ERROR_CODES,
} from '@/features/contact/domain/errors/contact.errors';

vi.mock('@/lib/redis', () => ({
  redis: new Redis(),
}));

describe('RedisContactRateLimiter', () => {
  const limiter = new RedisContactRateLimiter();

  beforeEach(async () => {
    const { redis } = await import('@/lib/redis');
    await redis.flushall();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('allows up to 5 requests per IP within the window', async () => {
    for (let index = 0; index < 5; index += 1) {
      await expect(limiter.check('203.0.113.1')).resolves.toBeUndefined();
    }
  });

  it('rejects the 6th request for the same IP', async () => {
    for (let index = 0; index < 5; index += 1) {
      await limiter.check('203.0.113.2');
    }

    await expect(limiter.check('203.0.113.2')).rejects.toMatchObject({
      code: CONTACT_ERROR_CODES.RATE_LIMIT_EXCEEDED,
      status: 429,
    });
  });

  it('does not block when IP is missing', async () => {
    await expect(limiter.check(null)).resolves.toBeUndefined();
  });

  it('throws ContactError instances for rate limit violations', async () => {
    for (let index = 0; index < 5; index += 1) {
      await limiter.check('203.0.113.3');
    }

    await expect(limiter.check('203.0.113.3')).rejects.toBeInstanceOf(
      ContactError,
    );
  });
});
