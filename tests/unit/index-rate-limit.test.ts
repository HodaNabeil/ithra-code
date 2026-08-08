import Redis from 'ioredis-mock';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { assertMessageRateLimit } from '@/ai-platform/infrastructure/guards/rate-limit.guard';
import { PlatformError } from '@/ai-platform/shared/errors';

vi.mock('@/lib/redis', () => ({
  redis: new Redis(),
}));

describe('index course rate limit', () => {
  beforeEach(async () => {
    const { redis } = await import('@/lib/redis');
    await redis.flushall();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('rejects the 6th request in a minute for index:course scope', async () => {
    const limits = {
      requestsPerMinute: 5,
      requestsPerHour: 20,
      requestsPerDay: 100,
    } as const;

    for (let index = 0; index < 5; index += 1) {
      await assertMessageRateLimit({
        userId: 'instructor-1',
        limits,
        scope: 'index:course',
      });
    }

    await expect(
      assertMessageRateLimit({
        userId: 'instructor-1',
        limits,
        scope: 'index:course',
      }),
    ).rejects.toBeInstanceOf(PlatformError);
  });
});
