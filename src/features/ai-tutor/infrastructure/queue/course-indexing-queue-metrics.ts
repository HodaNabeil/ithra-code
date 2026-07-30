import { Queue } from 'bullmq';

import { redis } from '@/lib/redis';

import { COURSE_INDEXING_QUEUE } from './course-indexing.constants';

export type CourseIndexingQueueMetrics = {
  queue: typeof COURSE_INDEXING_QUEUE;
  active: number;
  waiting: number;
  completed: number;
  failed: number;
  delayed: number;
};

export async function getCourseIndexingQueueMetrics(): Promise<CourseIndexingQueueMetrics> {
  const queue = new Queue(COURSE_INDEXING_QUEUE, { connection: redis });

  try {
    const counts = await queue.getJobCounts(
      'active',
      'waiting',
      'completed',
      'failed',
      'delayed',
    );

    return {
      queue: COURSE_INDEXING_QUEUE,
      active: counts.active ?? 0,
      waiting: counts.waiting ?? 0,
      completed: counts.completed ?? 0,
      failed: counts.failed ?? 0,
      delayed: counts.delayed ?? 0,
    };
  } finally {
    await queue.close();
  }
}
