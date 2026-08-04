import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';

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

function checkPlatformConfigured(): PlatformInfrastructureCheckStatus {
  if (!AIPlatformConfig.isEnabled()) {
    return 'skipped';
  }

  try {
    validateAIPlatformConfig();
    return 'ok';
  } catch (error) {
    logger.error({ error }, '[AI_PLATFORM_STARTUP] Platform config check failed');
    return 'error';
  }
}

export async function probePlatformInfrastructure(): Promise<PlatformInfrastructureValidationResult> {
  const enabled = AIPlatformConfig.isEnabled();

  const [database, redisStatus, pgvector] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkPgvector(),
  ]);

  const platformConfigured = checkPlatformConfigured();

  return {
    enabled,
    checks: {
      database,
      redis: redisStatus,
      pgvector,
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
      'AI Platform infrastructure validation failed. Check DATABASE_URL, REDIS_URL, pgvector extension, and OPENAI_API_KEY.',
    );
  }

  logger.info(
    { checks: result.checks },
    '[AI_PLATFORM_STARTUP] All platform dependencies are available',
  );

  return result;
}
