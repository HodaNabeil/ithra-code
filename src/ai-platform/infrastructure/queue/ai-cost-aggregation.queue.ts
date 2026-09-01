import { Queue } from 'bullmq';

import { AI_PLATFORM_CONSTANTS } from '../../shared/constants';
import { redis } from '@/lib/redis';

export const AI_COST_AGGREGATION_QUEUE =
  AI_PLATFORM_CONSTANTS.AI_COST_AGGREGATION_QUEUE;

export type CostAggregationJobData = {
  date?: string;
  mode?: 'incremental' | 'backfill';
};

export const aiCostAggregationQueue = new Queue<CostAggregationJobData>(
  AI_COST_AGGREGATION_QUEUE,
  {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 60_000 },
      removeOnComplete: 100,
      removeOnFail: 200,
    },
  },
);

export async function scheduleDailyCostAggregation(): Promise<void> {
  await aiCostAggregationQueue.add(
    'aggregate-daily',
    { mode: 'incremental' },
    {
      repeat: { pattern: '15 0 * * *' },
      jobId: 'ai-cost-aggregation-daily',
    },
  );
}
