import { createHash } from 'crypto';
import { redis } from '@/lib/redis';
import type {
  CatalogCacheScope,
  CourseCatalogPublicResult,
  CourseCatalogQuery,
} from '../dto/course-catalog.dto';
import { resolveViewerRole } from '../policies/course-visibility.policy';
import type { CatalogViewer } from '../dto/course-catalog.dto';

const CACHE_PREFIX = 'course:list:v1';
const CACHE_TTL_SECONDS = 60;

function normalizeQuery(query: CourseCatalogQuery): CourseCatalogQuery {
  return {
    page: query.page,
    limit: query.limit,
    search: query.search || undefined,
    sort: query.sort || 'newest',
    path: query.path || undefined,
    level: query.level || undefined,
    featured: query.featured || undefined,
  };
}

function buildQueryHash(query: CourseCatalogQuery): string {
  const normalized = normalizeQuery(query);
  const raw = JSON.stringify(normalized);
  return createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

export function resolveCacheScope(viewer: CatalogViewer): CatalogCacheScope {
  const role = resolveViewerRole(viewer);

  if (role === 'admin') return 'admin';
  if (role === 'instructor' && viewer?.id) return `instructor:${viewer.id}`;
  return 'public';
}

function buildCacheKey(scope: CatalogCacheScope, query: CourseCatalogQuery): string {
  return `${CACHE_PREFIX}:${scope}:${buildQueryHash(query)}`;
}

export const courseCatalogCache = {
  buildKey(scope: CatalogCacheScope, query: CourseCatalogQuery): string {
    return buildCacheKey(scope, query);
  },

  async get(
    scope: CatalogCacheScope,
    query: CourseCatalogQuery,
  ): Promise<CourseCatalogPublicResult | null> {
    try {
      const raw = await redis.get(buildCacheKey(scope, query));
      if (!raw) return null;
      return JSON.parse(raw) as CourseCatalogPublicResult;
    } catch (error) {
      console.error('[COURSE_CATALOG_CACHE_GET]', error);
      return null;
    }
  },

  async set(
    scope: CatalogCacheScope,
    query: CourseCatalogQuery,
    result: CourseCatalogPublicResult,
  ): Promise<void> {
    try {
      await redis.set(
        buildCacheKey(scope, query),
        JSON.stringify(result),
        'EX',
        CACHE_TTL_SECONDS,
      );
    } catch (error) {
      console.error('[COURSE_CATALOG_CACHE_SET]', error);
    }
  },
};
