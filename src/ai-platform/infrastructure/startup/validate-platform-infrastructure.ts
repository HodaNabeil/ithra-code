import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';

import { AI_PLATFORM_CONSTANTS } from '../../shared/constants';
import {
  AIPlatformConfig,
  validateAIPlatformConfig,
} from '../config/ai-platform.config';

export type PlatformInfrastructureCheckStatus = 'ok' | 'error' | 'skipped';

export type PlatformInfrastructureValidationResult = {
  enabled: boolean;
  checks: {
    database: PlatformInfrastructureCheckStatus;
    redis: PlatformInfrastructureCheckStatus;
    pgvector: PlatformInfrastructureCheckStatus;
    hnswIndex: PlatformInfrastructureCheckStatus;
    vectorProbe: PlatformInfrastructureCheckStatus;
    platformConfigured: PlatformInfrastructureCheckStatus;
  };
};

async function checkDatabase(): Promise<PlatformInfrastructureCheckStatus> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return 'ok';
  } catch (error) {
    logger.error({ error }, '[AI_PLATFORM_STARTUP] Database check failed');
    return 'error';
  }
}

async function checkRedis(): Promise<PlatformInfrastructureCheckStatus> {
  try {
    const pong = await redis.ping();
    return pong === 'PONG' ? 'ok' : 'error';
  } catch (error) {
    logger.error({ error }, '[AI_PLATFORM_STARTUP] Redis check failed');
    return 'error';
  }
}

async function checkPgvector(): Promise<PlatformInfrastructureCheckStatus> {
  try {
    const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
      ) AS exists
    `;
    return result[0]?.exists ? 'ok' : 'error';
  } catch (error) {
    logger.error({ error }, '[AI_PLATFORM_STARTUP] pgvector check failed');
    return 'error';
  }
}

async function checkHnswIndex(): Promise<PlatformInfrastructureCheckStatus> {
  try {
    const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'knowledge_chunks'
          AND indexname = 'knowledge_chunks_embedding_idx'
      ) AS exists
    `;
    return result[0]?.exists ? 'ok' : 'error';
  } catch (error) {
    logger.error({ error }, '[AI_PLATFORM_STARTUP] HNSW index check failed');
    return 'error';
  }
}

async function checkVectorProbe(): Promise<PlatformInfrastructureCheckStatus> {
  try {
    const countResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM knowledge_chunks
      WHERE embedding IS NOT NULL
    `;
    const indexedCount = Number(countResult[0]?.count ?? 0);
    if (indexedCount === 0) {
      return 'skipped';
    }

    const dimensions = AI_PLATFORM_CONSTANTS.EMBEDDING_DIMENSIONS;
    const zeroVector = `[${Array(dimensions).fill(0).join(',')}]`;
    await prisma.$queryRawUnsafe(
      `SELECT id
       FROM knowledge_chunks
       WHERE embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT 1`,
      zeroVector,
    );
    return 'ok';
  } catch (error) {
    logger.error({ error }, '[AI_PLATFORM_STARTUP] Vector probe check failed');
    return 'error';
  }
}

function checkPlatformConfigured(): PlatformInfrastructureCheckStatus {
  if (!AIPlatformConfig.isEnabled()) {
    return 'skipped';
  }

  try {
    validateAIPlatformConfig();
    return 'ok';
  } catch (error) {
    logger.error(
      { error },
      '[AI_PLATFORM_STARTUP] Platform config check failed',
    );
    return 'error';
  }
}

export async function probePlatformInfrastructure(): Promise<PlatformInfrastructureValidationResult> {
  const enabled = AIPlatformConfig.isEnabled();

  const [database, redisStatus, pgvector, hnswIndex, vectorProbe] =
    await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkPgvector(),
      checkHnswIndex(),
      checkVectorProbe(),
    ]);

  const platformConfigured = checkPlatformConfigured();

  return {
    enabled,
    checks: {
      database,
      redis: redisStatus,
      pgvector,
      hnswIndex,
      vectorProbe,
      platformConfigured,
    },
  };
}

function hasCriticalFailures(
  checks: PlatformInfrastructureValidationResult['checks'],
): boolean {
  return (
    checks.database === 'error' ||
    checks.redis === 'error' ||
    checks.pgvector === 'error' ||
    checks.hnswIndex === 'error' ||
    checks.vectorProbe === 'error' ||
    checks.platformConfigured === 'error'
  );
}

export async function validatePlatformInfrastructure(): Promise<PlatformInfrastructureValidationResult> {
  const result = await probePlatformInfrastructure();

  if (!result.enabled) {
    logger.info(
      { checks: result.checks },
      '[AI_PLATFORM_STARTUP] AI Platform disabled — skipping validation',
    );
    return result;
  }

  if (hasCriticalFailures(result.checks)) {
    logger.error(
      { checks: result.checks },
      '[AI_PLATFORM_STARTUP] Critical dependency check failed',
    );
    throw new Error(
      'AI Platform infrastructure validation failed. Check DATABASE_URL, REDIS_URL, pgvector extension, HNSW index on knowledge_chunks.embedding, and OPENAI_API_KEY.',
    );
  }

  logger.info(
    { checks: result.checks },
    '[AI_PLATFORM_STARTUP] All platform dependencies are available',
  );

  return result;
}
