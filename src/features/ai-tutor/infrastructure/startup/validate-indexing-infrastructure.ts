import { Queue } from 'bullmq';

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';

import {
  AITutorConfig,
  validateAITutorConfig,
} from '../config/ai-tutor.config';
import { AIPlatformConfig } from '@/ai-platform/infrastructure/config/ai-platform.config';
import { COURSE_INDEXING_QUEUE } from '@/ai-platform';

export type IndexingInfrastructureCheckStatus = 'ok' | 'error' | 'skipped';

export type IndexingInfrastructureValidationResult = {
  enabled: boolean;
  checks: {
    database: IndexingInfrastructureCheckStatus;
    redis: IndexingInfrastructureCheckStatus;
    pgvector: IndexingInfrastructureCheckStatus;
    aiTutorConfigured: IndexingInfrastructureCheckStatus;
    queueConnectivity: IndexingInfrastructureCheckStatus;
  };
};

async function checkDatabase(): Promise<IndexingInfrastructureCheckStatus> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return 'ok';
  } catch (error) {
    logger.error(
      { error },
      '[INDEXING_STARTUP_VALIDATION] Database check failed',
    );
    return 'error';
  }
}

async function checkRedis(): Promise<IndexingInfrastructureCheckStatus> {
  try {
    const pong = await redis.ping();
    return pong === 'PONG' ? 'ok' : 'error';
  } catch (error) {
    logger.error({ error }, '[INDEXING_STARTUP_VALIDATION] Redis check failed');
    return 'error';
  }
}

async function checkPgvector(): Promise<IndexingInfrastructureCheckStatus> {
  try {
    const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
      ) AS exists
    `;
    return result[0]?.exists ? 'ok' : 'error';
  } catch (error) {
    logger.error(
      { error },
      '[INDEXING_STARTUP_VALIDATION] pgvector check failed',
    );
    return 'error';
  }
}

async function checkQueueConnectivity(): Promise<IndexingInfrastructureCheckStatus> {
  const queue = new Queue(COURSE_INDEXING_QUEUE, { connection: redis });

  try {
    await queue.getJobCounts();
    return 'ok';
  } catch (error) {
    logger.error(
      { error },
      '[INDEXING_STARTUP_VALIDATION] BullMQ queue check failed',
    );
    return 'error';
  } finally {
    await queue.close();
  }
}

function checkAiTutorConfigured(): IndexingInfrastructureCheckStatus {
  if (!AITutorConfig.isEnabled()) {
    return 'skipped';
  }

  try {
    validateAITutorConfig();
    return 'ok';
  } catch (error) {
    logger.error(
      { error },
      '[INDEXING_STARTUP_VALIDATION] AI Tutor config check failed',
    );
    return 'error';
  }
}

export async function probeIndexingInfrastructure(): Promise<IndexingInfrastructureValidationResult> {
  const enabled = AITutorConfig.isEnabled();

  const [database, redisStatus, pgvector, queueConnectivity] =
    await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkPgvector(),
      enabled ? checkQueueConnectivity() : Promise.resolve('skipped' as const),
    ]);

  const aiTutorConfigured = checkAiTutorConfigured();

  return {
    enabled,
    checks: {
      database,
      redis: redisStatus,
      pgvector,
      aiTutorConfigured,
      queueConnectivity,
    },
  };
}

function hasCriticalFailures(
  checks: IndexingInfrastructureValidationResult['checks'],
): boolean {
  const criticalChecks = [
    checks.database,
    checks.redis,
    checks.pgvector,
    checks.aiTutorConfigured,
  ] as const;

  return (
    criticalChecks.some((status) => status === 'error') ||
    checks.queueConnectivity === 'error'
  );
}

export async function validateIndexingInfrastructure(): Promise<IndexingInfrastructureValidationResult> {
  const result = await probeIndexingInfrastructure();

  if (!result.enabled) {
    logger.info(
      { checks: result.checks },
      '[INDEXING_STARTUP_VALIDATION] AI Tutor disabled — indexing worker will not start',
    );
    return result;
  }

  if (hasCriticalFailures(result.checks)) {
    logger.error(
      { checks: result.checks },
      '[INDEXING_STARTUP_VALIDATION] Critical dependency check failed',
    );
    throw new Error(
      'Course indexing infrastructure validation failed. Check DATABASE_URL, REDIS_URL, pgvector extension, and OPENAI_API_KEY.',
    );
  }

  const embeddingConfig = AIPlatformConfig.getEmbeddingConfig();
  const llmConfig = AIPlatformConfig.getLlmConfig();

  logger.info(
    {
      checks: result.checks,
      embeddingModel: embeddingConfig.model,
      llmModel: llmConfig.model,
      queue: COURSE_INDEXING_QUEUE,
    },
    '[INDEXING_STARTUP_VALIDATION] All indexing dependencies are available',
  );

  return result;
}
