import 'dotenv/config';

import { Worker } from 'bullmq';
import type { Job } from 'bullmq';

import {
  aggregateIncrementalUsage,
  aggregateUsageForDate,
} from '@/ai-platform/observability/cost/aggregation.handler';
import {
  AI_COST_AGGREGATION_QUEUE,
  type CostAggregationJobData,
  scheduleDailyCostAggregation,
} from '@/ai-platform/infrastructure/queue/ai-cost-aggregation.queue';
import { initOtel } from '@/ai-platform/observability/opentelemetry/otel-setup';
import { AIPlatformConfig } from '@/ai-platform/infrastructure/config/ai-platform.config';
import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';

initOtel();

async function processJob(job: Job<CostAggregationJobData>) {
  if (!AIPlatformConfig.isEnabled()) {
    return { skipped: true };
  }

  if (job.data.date) {
    return aggregateUsageForDate(new Date(job.data.date));
  }

  return aggregateIncrementalUsage();
}

const worker = new Worker<CostAggregationJobData>(
  AI_COST_AGGREGATION_QUEUE,
  async (job) => processJob(job),
  { connection: redis, concurrency: 1 },
);

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, '[AI_COST_AGGREGATION_JOB_FAILED]');
});

void scheduleDailyCostAggregation().catch((error) => {
  logger.error({ error }, '[AI_COST_AGGREGATION_SCHEDULE_FAILED]');
});

logger.info({ queue: AI_COST_AGGREGATION_QUEUE }, '[AI_COST_AGGREGATION_WORKER_READY]');

export default worker;
