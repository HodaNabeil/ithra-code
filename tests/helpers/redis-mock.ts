import Redis from 'ioredis-mock';
import { vi } from 'vitest';

export function mockRedisModule(): void {
  vi.mock('@/lib/redis', () => ({
    redis: new Redis(),
  }));
}
