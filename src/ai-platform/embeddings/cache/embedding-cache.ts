import { createHash } from 'node:crypto';

import { AI_PLATFORM_CONSTANTS } from '../../shared/constants';
import { EMBEDDING_DIMENSIONS } from '../dimensions';

function buildEmbeddingCacheKey(text: string): string {
  const hash = createHash('sha256').update(text.trim()).digest('hex');
  return `${AI_PLATFORM_CONSTANTS.KEY_PREFIX_EMBED}${hash}`;
}

async function getRedisClient() {
  const { redis } = await import('@/lib/redis');
  return redis;
}

export async function getCachedEmbedding(text: string): Promise<number[] | null> {
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
    if (!Array.isArray(parsed) || parsed.length !== EMBEDDING_DIMENSIONS) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function setCachedEmbedding(text: string, embedding: number[]): Promise<void> {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  try {
    const redis = await getRedisClient();
    await redis.set(
      buildEmbeddingCacheKey(text),
      JSON.stringify(embedding),
      'EX',
      AI_PLATFORM_CONSTANTS.EMBEDDING_CACHE_TTL_SECONDS,
    );
  } catch {
    // Cache failures are non-critical.
  }
}
