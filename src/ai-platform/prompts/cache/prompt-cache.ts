import type {
  PromptQuery,
  ResolvedPrompt,
} from '../ports/prompt-repository.port';

type CacheEntry = {
  prompt: ResolvedPrompt;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry>();

function buildCacheKey(query: PromptQuery): string {
  const locale = query.locale ?? 'ar';
  const label = query.label ?? 'production';
  const version = query.version ?? 'latest';
  return `${query.key}:${version}:${label}:${locale}`;
}

export function getCachedPrompt(query: PromptQuery): ResolvedPrompt | null {
  const key = buildCacheKey(query);
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return { ...entry.prompt, source: 'cache' };
}

export function setCachedPrompt(
  query: PromptQuery,
  prompt: ResolvedPrompt,
  ttlMs: number,
): void {
  const key = buildCacheKey(query);
  cache.set(key, {
    prompt,
    expiresAt: Date.now() + ttlMs,
  });
}

export function clearPromptCache(): void {
  cache.clear();
}
