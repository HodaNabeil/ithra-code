import { AI_PLATFORM_CONSTANTS } from '../../shared/constants';

const KEY_PREFIX = 'ai:working:';

async function getRedisClient() {
  const { redis } = await import('@/lib/redis');
  return redis;
}

export async function setWorkingMemory(
  runId: string,
  state: Record<string, unknown>,
): Promise<void> {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  try {
    const redis = await getRedisClient();
    await redis.set(
      `${KEY_PREFIX}${runId}`,
      JSON.stringify({ state, updatedAt: new Date().toISOString() }),
      'EX',
      1800,
    );
  } catch {
    // Non-critical cache.
  }
}

export async function getWorkingMemory(runId: string): Promise<Record<string, unknown> | null> {
  if (process.env.NODE_ENV === 'test') {
    return null;
  }

  try {
    const redis = await getRedisClient();
    const raw = await redis.get(`${KEY_PREFIX}${runId}`);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as { state?: Record<string, unknown> };
    return parsed.state ?? null;
  } catch {
    return null;
  }
}

export async function invalidateWorkingMemory(runId: string): Promise<void> {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  try {
    const redis = await getRedisClient();
    await redis.del(`${KEY_PREFIX}${runId}`);
  } catch {
    // Non-critical.
  }
}

export const WORKING_MEMORY_TTL_SECONDS = AI_PLATFORM_CONSTANTS.SESSION_CACHE_TTL_MS / 1000 * 6;
