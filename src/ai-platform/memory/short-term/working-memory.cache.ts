import { AI_PLATFORM_CONSTANTS } from '../../shared/constants';

const KEY_PREFIX = 'ai:working:';

/**
 * Per-run working memory cache, backed by Redis. Scoped by `runId` +
 * `scope` (e.g. `retrieval`, `tool:search`) so different graph steps within
 * the same run don't clobber each other's cached intermediate state. This
 * lets multi-turn tool loops (generate-response -> tool-call -> ...) reuse
 * results already computed earlier in the same run instead of re-embedding
 * or re-searching for an identical query.
 */
export const WORKING_MEMORY_TTL_SECONDS =
  (AI_PLATFORM_CONSTANTS.SESSION_CACHE_TTL_MS / 1000) * 6;

async function getRedisClient() {
  const { redis } = await import('@/lib/redis');
  return redis;
}

function buildKey(runId: string, scope: string): string {
  return `${KEY_PREFIX}${runId}:${scope}`;
}

export async function setWorkingMemory(
  runId: string,
  scope: string,
  state: Record<string, unknown>,
): Promise<void> {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  try {
    const redis = await getRedisClient();
    await redis.set(
      buildKey(runId, scope),
      JSON.stringify({ state, updatedAt: new Date().toISOString() }),
      'EX',
      WORKING_MEMORY_TTL_SECONDS,
    );
  } catch {
    // Non-critical cache.
  }
}

export async function getWorkingMemory(
  runId: string,
  scope: string,
): Promise<Record<string, unknown> | null> {
  if (process.env.NODE_ENV === 'test') {
    return null;
  }

  try {
    const redis = await getRedisClient();
    const raw = await redis.get(buildKey(runId, scope));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as { state?: Record<string, unknown> };
    return parsed.state ?? null;
  } catch {
    return null;
  }
}

export async function invalidateWorkingMemory(
  runId: string,
  scope: string,
): Promise<void> {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  try {
    const redis = await getRedisClient();
    await redis.del(buildKey(runId, scope));
  } catch {
    // Non-critical.
  }
}
