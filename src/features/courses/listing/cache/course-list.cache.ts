import { createHash } from 'crypto';
import { redis } from '@/lib/redis';
import type {
  CourseListCacheScope,
  CourseListPublicResult,
  CourseListQuery,
  CourseViewer,
} from '../dto/course-list.dto';
import { resolveViewerRole } from '../policies/course-visibility.policy';

const CACHE_PREFIX = 'course:list:v1';
const CACHE_TTL_SECONDS = 60;

function normalizeQuery(query: CourseListQuery): CourseListQuery {
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

function buildQueryHash(query: CourseListQuery): string {
  const normalized = normalizeQuery(query);
  const raw = JSON.stringify(normalized);
  return createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

export function resolveCacheScope(viewer: CourseViewer): CourseListCacheScope {
  const role = resolveViewerRole(viewer);

  if (role === 'admin') return 'admin';
  if (role === 'instructor' && viewer?.id) return `instructor:${viewer.id}`;
  return 'public';
}

function buildCacheKey(
  scope: CourseListCacheScope,
  query: CourseListQuery,
): string {
  return `${CACHE_PREFIX}:${scope}:${buildQueryHash(query)}`;
}

export const courseListCache = {
  buildKey(scope: CourseListCacheScope, query: CourseListQuery): string {
    return buildCacheKey(scope, query);
  },

  async get(
    scope: CourseListCacheScope,
    query: CourseListQuery,
  ): Promise<CourseListPublicResult | null> {
    try {
      const raw = await redis.get(buildCacheKey(scope, query));
      if (!raw) return null;
      return JSON.parse(raw) as CourseListPublicResult;
    } catch (error) {
      console.error('[COURSE_LIST_CACHE_GET]', error);
      return null;
    }
  },

  async set(
    scope: CourseListCacheScope,
    query: CourseListQuery,
    result: CourseListPublicResult,
  ): Promise<void> {
    try {
      await redis.set(
        buildCacheKey(scope, query),
        JSON.stringify(result),
        'EX',
        CACHE_TTL_SECONDS,
      );
    } catch (error) {
      console.error('[COURSE_LIST_CACHE_SET]', error);
    }
  },
};
