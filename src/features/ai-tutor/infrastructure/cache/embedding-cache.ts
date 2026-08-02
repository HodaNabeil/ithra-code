import { createHash } from 'node:crypto';

import { AI_TUTOR_CONSTANTS } from '../../shared';

const EMBEDDING_CACHE_PREFIX = 'tutor:embed';
const EMBEDDING_CACHE_TTL_SECONDS = 3600;

function buildEmbeddingCacheKey(text: string): string {
  const hash = createHash('sha256').update(text.trim()).digest('hex');
  return `${EMBEDDING_CACHE_PREFIX}:${hash}`;
}

async function getRedisClient() {
  const { redis } = await import('@/lib/redis');
  return redis;
}

export async function getCachedEmbedding(
  text: string,
): Promise<number[] | null> {
  if (process.env.NODE_ENV === 'test') {
    return null;
  }

  try {
    const redis = await getRedisClient();
    const cached = await redis.get(buildEmbeddingCacheKey(text));
    if (!cached) {
      return null;
    }

    const parsed = JSON.parse(cached) as number[];
    if (
      !Array.isArray(parsed) ||
      parsed.length !== AI_TUTOR_CONSTANTS.EMBEDDING_DIMENSIONS
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function setCachedEmbedding(
  text: string,
  embedding: number[],
): Promise<void> {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  try {
    const redis = await getRedisClient();
    await redis.set(
      buildEmbeddingCacheKey(text),
      JSON.stringify(embedding),
      'EX',
      EMBEDDING_CACHE_TTL_SECONDS,
    );
  } catch {
    // Cache failures are non-critical.
  }
}
