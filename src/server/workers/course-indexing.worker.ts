import 'dotenv/config';

import { Worker } from 'bullmq';
import type { Job } from 'bullmq';

import { loadCourseForIndexing } from '@/features/ai-tutor/application/services/content-extraction.service';
import {
  runCourseIndexing,
  runLectureIndexing,
} from '@/ai-platform/indexing/pipelines/course-indexing.pipeline';
import type { CourseIndexingRequestedEvent } from '@/ai-platform/indexing/constants';
import { AITutorConfig } from '@/features/ai-tutor/infrastructure/config/ai-tutor.config';
import {
  getCourseIndexingDeps,
  getCourseContentRepository,
} from '@/ai-platform/infrastructure/di/ai-platform.container';
import { bootstrapUnindexedCourseIndexing } from '@/ai-platform/indexing/pipelines/bootstrap';
import { validateIndexingInfrastructure } from '@/features/ai-tutor/infrastructure/startup/validate-indexing-infrastructure';
import { COURSE_INDEXING_QUEUE } from '@/ai-platform/indexing/pipelines/enqueue';
import {
  handleCourseIndexingJob,
  type IndexingJobResult,
} from '@/ai-platform/indexing/workers/course-indexing.handler';
import { initOtel } from '@/ai-platform/observability/opentelemetry/otel-setup';
import { AIPlatformConfig } from '@/ai-platform/infrastructure/config/ai-platform.config';
import { AI_PLATFORM_CONSTANTS } from '@/ai-platform/shared/constants';
import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';

const shutdownGraceMs = Number(
  process.env.COURSE_INDEXING_SHUTDOWN_GRACE_MS ?? 30_000,
);
const workerConcurrency = AIPlatformConfig.isEnabled()
  ? AIPlatformConfig.getIndexingWorkerConcurrency()
  : AITutorConfig.getIndexingWorkerConcurrency();
const WORKER_HEARTBEAT_KEY =
  AI_PLATFORM_CONSTANTS.COURSE_INDEXING_WORKER_HEARTBEAT_KEY;
const WORKER_HEARTBEAT_INTERVAL_MS = 30_000;

initOtel();

let shuttingDown = false;
let worker: Worker<CourseIndexingRequestedEvent> | null = null;

async function processCourseIndexingEvent(
  event: CourseIndexingRequestedEvent,
): Promise<IndexingJobResult> {
  const deps = getCourseIndexingDeps();
  const course = await loadCourseForIndexing(event.courseSlug, {
    courseContentRepository: getCourseContentRepository(),
  });

  if (event.scope === 'lecture' && event.lectureId) {
    return runLectureIndexing(course, event.lectureId, deps);
  }

  return runCourseIndexing(course, deps);
}

async function processJob(
  job: Job<CourseIndexingRequestedEvent>,
): Promise<IndexingJobResult> {
  return handleCourseIndexingJob(job, {
    isEnabled: () => AITutorConfig.isEnabled(),
    processEvent: processCourseIndexingEvent,
  });
}

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  logger.info(
    { signal, shutdownGraceMs },
    '[COURSE_INDEXING_WORKER_SHUTDOWN] Draining in-flight jobs',
  );

  if (worker) {
    await Promise.race([
      worker.close(),
      new Promise((resolve) => setTimeout(resolve, shutdownGraceMs)),
    ]);
  }

  logger.info({ signal }, '[COURSE_INDEXING_WORKER_SHUTDOWN] Worker stopped');
  process.exit(0);
}

async function startWorker(): Promise<void> {
  try {
    const validation = await validateIndexingInfrastructure();
    if (!validation.enabled) {
      process.exit(0);
    }
  } catch (error) {
    logger.error({ error }, '[COURSE_INDEXING_WORKER_STARTUP_FAILED]');
    process.exit(1);
  }

  worker = new Worker<CourseIndexingRequestedEvent>(
    COURSE_INDEXING_QUEUE,
    async (job) => processJob(job),
    { connection: redis, concurrency: workerConcurrency },
  );

  const heartbeatTimer = setInterval(() => {
    void redis
      .set(WORKER_HEARTBEAT_KEY, new Date().toISOString(), 'EX', 120)
      .catch((error) => {
        logger.error({ error }, '[COURSE_INDEXING_WORKER_HEARTBEAT_FAILED]');
      });
  }, WORKER_HEARTBEAT_INTERVAL_MS);

  worker.on('closed', () => {
    clearInterval(heartbeatTimer);
  });

  worker.on('failed', (job, err) => {
    logger.error(
      {
        jobId: job?.id,
        jobName: job?.name,
        courseId: job?.data.courseId,
        lectureId: job?.data.lectureId,
        scope: job?.data.scope,
        attemptsMade: job?.attemptsMade,
        maxAttempts: job?.opts.attempts,
        err,
      },
      '[COURSE_INDEXING_WORKER_JOB_FAILED]',
    );
  });

  logger.info(
    {
      queue: COURSE_INDEXING_QUEUE,
      aiTutorEnabled: AITutorConfig.isEnabled(),
      aiPlatformEnabled: AIPlatformConfig.isEnabled(),
      shutdownGraceMs,
    },
    '[COURSE_INDEXING_WORKER_READY] Waiting for publish/indexing jobs',
  );

  void bootstrapUnindexedCourseIndexing({
    isEnabled: () => AITutorConfig.isEnabled(),
  }).catch((error) => {
    logger.error({ error }, '[COURSE_INDEXING_BOOTSTRAP_FAILED]');
  });
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

void startWorker();

export default worker;
