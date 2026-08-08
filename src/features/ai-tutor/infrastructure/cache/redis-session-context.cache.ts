import { redis } from '@/lib/redis';

import type { TutorSessionContext } from '../../domain/models/TutorSessionContext';
import type { SessionContextCachePort } from '../../domain/ports/SessionContextCachePort';
import { AI_TUTOR_CONSTANTS } from '../../shared';

const CACHE_PREFIX = AI_TUTOR_CONSTANTS.CONTEXT_CACHE_KEY_PREFIX;
const CACHE_TTL_SECONDS = Math.ceil(
  AI_TUTOR_CONSTANTS.CONTEXT_CACHE_TTL_MS / 1000,
);

function buildRedisKey(cacheKey: string): string {
  return `${CACHE_PREFIX}:${cacheKey}`;
}

function serializeContext(context: TutorSessionContext): string {
  return JSON.stringify(context);
}

function deserializeContext(raw: string): TutorSessionContext {
  const parsed = JSON.parse(raw) as TutorSessionContext;

  if (parsed.learningProfile?.lastUpdatedAt) {
    parsed.learningProfile.lastUpdatedAt = new Date(
      parsed.learningProfile.lastUpdatedAt,
    );
  }

  for (const lecture of parsed.studentProgress.lectureProgress) {
    if (lecture.lastAccessedAt) {
      lecture.lastAccessedAt = new Date(lecture.lastAccessedAt);
    }
  }

  return parsed;
}

export class RedisSessionContextCache implements SessionContextCachePort {
  async get(cacheKey: string): Promise<TutorSessionContext | null> {
    try {
      const raw = await redis.get(buildRedisKey(cacheKey));
      if (!raw) {
        return null;
      }

      return deserializeContext(raw);
    } catch (error) {
      console.error('[AI_TUTOR_SESSION_CONTEXT_CACHE_GET]', error);
      return null;
    }
  }

  async set(cacheKey: string, value: TutorSessionContext): Promise<void> {
    try {
      await redis.set(
        buildRedisKey(cacheKey),
        serializeContext(value),
        'EX',
        CACHE_TTL_SECONDS,
      );
    } catch (error) {
      console.error('[AI_TUTOR_SESSION_CONTEXT_CACHE_SET]', error);
    }
  }

  async invalidate(cacheKey: string): Promise<void> {
    try {
      await redis.del(buildRedisKey(cacheKey));
    } catch (error) {
      console.error('[AI_TUTOR_SESSION_CONTEXT_CACHE_INVALIDATE]', error);
    }
  }
}

export const redisSessionContextCache = new RedisSessionContextCache();
