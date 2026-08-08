import { createHash } from 'node:crypto';

import { AIPlatformConfig } from '../../infrastructure/config/ai-platform.config';
import { AI_PLATFORM_CONSTANTS } from '../../shared/constants';

export function buildEmbeddingCacheKeyFromParts(
  text: string,
  model: string,
  dimensions: number,
): string {
  const hash = createHash('sha256')
    .update(`${model}:${dimensions}:${text.trim()}`)
    .digest('hex');
  return `${AI_PLATFORM_CONSTANTS.KEY_PREFIX_EMBED}${hash}`;
}

export function buildEmbeddingCacheKey(text: string): string {
  const embedding = AIPlatformConfig.getEmbeddingConfig();
  return buildEmbeddingCacheKeyFromParts(
    text,
    embedding.model,
    embedding.dimensions,
  );
}

async function getRedisClient() {
  const { redis } = await import('@/lib/redis');
  return redis;
}

export async function getCachedEmbedding(text: string): Promise<number[] | null> {
  if (process.env.NODE_ENV === 'test') {
    return null;
  }

  const expectedDimensions = AIPlatformConfig.getEmbeddingConfig().dimensions;

  try {
    const redis = await getRedisClient();
    const cached = await redis.get(buildEmbeddingCacheKey(text));
    if (!cached) {
      return null;
    }

    const parsed = JSON.parse(cached) as number[];
    if (!Array.isArray(parsed) || parsed.length !== expectedDimensions) {
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

  const expectedDimensions = AIPlatformConfig.getEmbeddingConfig().dimensions;
  if (embedding.length !== expectedDimensions) {
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
