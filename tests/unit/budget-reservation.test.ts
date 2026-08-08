import Redis from 'ioredis-mock';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  reconcileDailyBudgetUsd,
  releaseDailyBudgetReservation,
  reserveDailyBudgetUsd,
  usdToMicro,
} from '@/ai-platform/infrastructure/guards/cost-cap.guard';

vi.mock('@/lib/redis', () => ({
  redis: new Redis(),
}));

describe('budget reservation', () => {
  beforeEach(async () => {
    const { redis } = await import('@/lib/redis');
    await redis.flushall();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('prevents concurrent reservations from exceeding cap', async () => {
    const capUsd = 1;
    const estimatedUsd = 0.3;

    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () =>
        reserveDailyBudgetUsd({
          userId: 'user-1',
          estimatedUsd,
          userCapUsd: capUsd,
          globalCapUsd: 0,
        }),
      ),
    );

    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');

    expect(fulfilled.length).toBeLessThanOrEqual(3);
    expect(rejected.length).toBeGreaterThan(0);
  });

  it('reconciles reserved budget to actual spend', async () => {
    const reservation = await reserveDailyBudgetUsd({
      userId: 'user-2',
      estimatedUsd: 1,
      userCapUsd: 10,
      globalCapUsd: 0,
    });

    expect(reservation?.reservedMicroUsd).toBe(usdToMicro(1));

    await reconcileDailyBudgetUsd({
      userId: 'user-2',
      reservedMicroUsd: reservation!.reservedMicroUsd,
      actualUsd: 0.25,
    });

    const { redis } = await import('@/lib/redis');
    const date = new Date().toISOString().slice(0, 10);
    const spent = Number(await redis.get(`ai:budget:usd:user:user-2:${date}`));
    expect(spent).toBe(usdToMicro(0.25));
  });

  it('releases reservation on failure', async () => {
    const reservation = await reserveDailyBudgetUsd({
      userId: 'user-3',
      estimatedUsd: 0.5,
      userCapUsd: 10,
      globalCapUsd: 0,
    });

    await releaseDailyBudgetReservation(reservation);

    const { redis } = await import('@/lib/redis');
    const date = new Date().toISOString().slice(0, 10);
    const spent = Number(await redis.get(`ai:budget:usd:user:user-3:${date}`));
    expect(spent).toBe(0);
  });
});
