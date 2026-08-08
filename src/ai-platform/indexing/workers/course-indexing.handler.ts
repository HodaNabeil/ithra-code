import { UnrecoverableError } from 'bullmq';
import type { Job } from 'bullmq';

import { logger } from '@/lib/logger';

import {
  markIndexingOutboxCompleted,
  markIndexingOutboxWorkerFailed,
} from '../outbox/indexing-outbox.service';
import { IndexingError, IndexingErrorCodes } from '../../application/errors/indexing.error';
import type { CourseIndexingRequestedEvent } from '../constants';

export type IndexingJobResult = Record<string, unknown> & {
  chunksIndexed: number;
  sourcesProcessed: number;
  sourcesUnchanged?: number;
  attachmentsSkipped?: number;
  errors?: number;
};

export type CourseIndexingProcessor = (
  event: CourseIndexingRequestedEvent,
) => Promise<IndexingJobResult>;

export type CourseIndexingHandlerOptions = {
  isEnabled: () => boolean;
  processEvent: CourseIndexingProcessor;
};

const NON_RETRYABLE_INDEXING_CODES = new Set<string>([
  IndexingErrorCodes.NO_CONTENT,
  IndexingErrorCodes.COURSE_NOT_FOUND,
  IndexingErrorCodes.COURSE_NOT_PUBLISHED,
  IndexingErrorCodes.FEATURE_DISABLED,
]);

function toUnrecoverableError(error: IndexingError): UnrecoverableError {
  return new UnrecoverableError(error.message);
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

export async function handleCourseIndexingJob(
  job: Job<CourseIndexingRequestedEvent>,
  options: CourseIndexingHandlerOptions,
): Promise<IndexingJobResult> {
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

  if (!options.isEnabled()) {
    logger.info(
      { courseId: event.courseId, scope: event.scope },
      '[COURSE_INDEXING_WORKER_SKIPPED] Indexing disabled',
    );
    throw new UnrecoverableError('Indexing is disabled');
  }

  try {
    const result = await options.processEvent(event);
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

    if (event.outboxId) {
      await markIndexingOutboxCompleted(event.outboxId);
    }

    return result;
  } catch (error) {
    if (event.outboxId) {
      await markIndexingOutboxWorkerFailed(event.outboxId, error);
    }

    if (error instanceof IndexingError && NON_RETRYABLE_INDEXING_CODES.has(error.code)) {
      throw toUnrecoverableError(error);
    }

    throw error;
  }
}
