import 'dotenv/config';

import { UnrecoverableError, Worker } from 'bullmq';
import type { Job } from 'bullmq';

import { loadCourseForIndexing } from '@/features/ai-tutor/application/services/content-extraction.service';
import {
  runCourseIndexing,
  runLectureIndexing,
} from '@/features/ai-tutor/application/services/course-indexing-runner.service';
import type { CourseIndexingRequestedEvent } from '@/features/ai-tutor/application/events/course-indexing-requested.event';
import {
  IndexingError,
  IndexingErrorCodes,
} from '@/features/ai-tutor/application/errors/indexing.errors';
import type { IndexCourseResultDTO } from '@/features/ai-tutor/application/dto/index-course.dto';
import type { IndexLectureResultDTO } from '@/features/ai-tutor/application/dto/index-lecture.dto';
import { AITutorConfig } from '@/features/ai-tutor/infrastructure/config/ai-tutor.config';
import { getIndexCourseUseCaseDeps } from '@/features/ai-tutor/infrastructure/di/ai-tutor-container';
import { bootstrapUnindexedCourseIndexing } from '@/features/ai-tutor/infrastructure/queue/course-indexing-bootstrap';
import { COURSE_INDEXING_QUEUE } from '@/features/ai-tutor/infrastructure/queue/course-indexing.publisher';
import { validateIndexingInfrastructure } from '@/features/ai-tutor/infrastructure/startup/validate-indexing-infrastructure';
import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';

type IndexingJobResult = IndexCourseResultDTO | IndexLectureResultDTO;

const NON_RETRYABLE_INDEXING_CODES = new Set<string>([
  IndexingErrorCodes.NO_CONTENT,
  IndexingErrorCodes.COURSE_NOT_FOUND,
  IndexingErrorCodes.COURSE_NOT_PUBLISHED,
  IndexingErrorCodes.FEATURE_DISABLED,
]);

const shutdownGraceMs = Number(process.env.COURSE_INDEXING_SHUTDOWN_GRACE_MS ?? 30_000);
const workerConcurrency = AITutorConfig.getIndexingWorkerConcurrency();
const WORKER_HEARTBEAT_KEY = 'tutor:worker:heartbeat';
const WORKER_HEARTBEAT_INTERVAL_MS = 30_000;

let shuttingDown = false;
let worker: Worker<CourseIndexingRequestedEvent> | null = null;

function toUnrecoverableError(error: IndexingError): UnrecoverableError {
  return new UnrecoverableError(error.message);
}

async function processCourseIndexingEvent(
  event: CourseIndexingRequestedEvent,
): Promise<IndexingJobResult> {
  if (!AITutorConfig.isEnabled()) {
    logger.info(
      { courseId: event.courseId, scope: event.scope },
      '[COURSE_INDEXING_WORKER_SKIPPED] AI Tutor disabled',
    );
    throw new UnrecoverableError('AI Tutor feature is disabled');
  }

  const deps = getIndexCourseUseCaseDeps();
  const course = await loadCourseForIndexing(event.courseSlug, {
    courseContentRepository: deps.courseContentRepository,
  });

  if (event.scope === 'lecture' && event.lectureId) {
    return runLectureIndexing(course, event.lectureId, deps);
  }

  return runCourseIndexing(course, deps);
}

function logPartialFailure(
  event: CourseIndexingRequestedEvent,
  result: IndexingJobResult,
): void {
  const errors = result.errors ?? 0;
  if (errors <= 0) {
    return;
  }

  logger.warn(
    {
      courseId: event.courseId,
      lectureId: event.lectureId,
      scope: event.scope,
      errors,
      chunksIndexed: result.chunksIndexed,
      sourcesUnchanged: result.sourcesUnchanged ?? 0,
    },
    '[COURSE_INDEXING_WORKER_PARTIAL_FAILURE]',
  );
}

function assertRetryableResult(
  event: CourseIndexingRequestedEvent,
  result: IndexingJobResult,
): void {
  const errors = result.errors ?? 0;
  if (
    errors > 0 &&
    result.chunksIndexed === 0 &&
    (result.sourcesUnchanged ?? 0) === 0
  ) {
    throw new Error(
      `Indexing failed for all sources (courseId=${event.courseId}, lectureId=${event.lectureId ?? 'n/a'})`,
    );
  }
}

async function processJob(job: Job<CourseIndexingRequestedEvent>): Promise<IndexingJobResult> {
  const event = job.data;
  const startedAt = performance.now();

  logger.info(
    {
      jobId: job.id,
      courseId: event.courseId,
      lectureId: event.lectureId,
      scope: event.scope,
      contentVersion: event.contentVersion,
      attemptsMade: job.attemptsMade,
    },
    '[COURSE_INDEXING_WORKER_JOB_STARTED]',
  );

  try {
    const result = await processCourseIndexingEvent(event);
    logPartialFailure(event, result);
    assertRetryableResult(event, result);

    logger.info(
      {
        jobId: job.id,
        courseId: event.courseId,
        lectureId: event.lectureId,
        scope: event.scope,
        durationMs: Math.round(performance.now() - startedAt),
        attemptsMade: job.attemptsMade,
        chunksIndexed: result.chunksIndexed,
        sourcesProcessed: result.sourcesProcessed,
        sourcesUnchanged: result.sourcesUnchanged,
        attachmentsSkipped: result.attachmentsSkipped,
        errors: result.errors ?? 0,
      },
      '[COURSE_INDEXING_WORKER_JOB_COMPLETED]',
    );

    return result;
  } catch (error) {
    if (error instanceof IndexingError && NON_RETRYABLE_INDEXING_CODES.has(error.code)) {
      throw toUnrecoverableError(error);
    }

    throw error;
  }
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
      shutdownGraceMs,
    },
    '[COURSE_INDEXING_WORKER_READY] Waiting for publish/indexing jobs',
  );

  void bootstrapUnindexedCourseIndexing().catch((error) => {
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
