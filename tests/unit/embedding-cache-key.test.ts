import { describe, expect, it } from 'vitest';

import { buildEmbeddingCacheKeyFromParts } from '@/ai-platform/embeddings/cache/embedding-cache';

describe('embedding cache key', () => {
  it('includes model and dimensions so model changes invalidate entries', () => {
    const smallKey = buildEmbeddingCacheKeyFromParts(
      'نفس النص',
      'text-embedding-3-small',
      1536,
    );
    const largeKey = buildEmbeddingCacheKeyFromParts(
      'نفس النص',
      'text-embedding-3-large',
      1536,
    );

    expect(smallKey).not.toBe(largeKey);
  });
});
