import { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';

import type { CourseKnowledgeIndexerPort } from '@/features/courses/application/ports/course-knowledge-indexer.port';
import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';

import type { CourseIndexingRequestedEvent } from '../../application/events/course-indexing-requested.event';
import { AITutorConfig } from '../config/ai-tutor.config';
import {
  buildCourseIndexingJobId,
  COURSE_INDEXING_JOBS,
  COURSE_INDEXING_QUEUE,
} from './course-indexing.constants';

export {
  buildCourseIndexingJobId,
  COURSE_INDEXING_JOBS,
  COURSE_INDEXING_QUEUE,
} from './course-indexing.constants';

let courseIndexingQueue: Queue<CourseIndexingRequestedEvent> | null = null;

function getCourseIndexingQueue(): Queue<CourseIndexingRequestedEvent> {
  courseIndexingQueue ??= new Queue<CourseIndexingRequestedEvent>(COURSE_INDEXING_QUEUE, {
    connection: redis,
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 60_000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  });

  return courseIndexingQueue;
}

/**
 * Publishes course/lecture indexing work to BullMQ.
 * Failures are logged and rethrown for callers that want to swallow them.
 */
export class BullmqCourseKnowledgeIndexer implements CourseKnowledgeIndexerPort {
  async scheduleIndexing(
    request: Parameters<CourseKnowledgeIndexerPort['scheduleIndexing']>[0],
  ): Promise<void> {
    if (!AITutorConfig.isEnabled()) {
      logger.info(
        { courseId: request.courseId, scope: request.scope },
        '[COURSE_INDEXING_SKIPPED] AI Tutor disabled',
      );
      return;
    }

    const event: CourseIndexingRequestedEvent = {
      eventId: randomUUID(),
      courseId: request.courseId,
      courseSlug: request.courseSlug,
      scope: request.scope,
      lectureId: request.lectureId,
      triggeredByUserId: request.triggeredByUserId,
      contentVersion: request.contentVersion,
      requestedAt: new Date().toISOString(),
    };

    const queue = getCourseIndexingQueue();
    const jobName =
      request.scope === 'lecture'
        ? COURSE_INDEXING_JOBS.INDEX_LECTURE
        : COURSE_INDEXING_JOBS.INDEX_COURSE;
    const jobId = buildCourseIndexingJobId(event);

    await queue.add(jobName, event, {
      jobId,
    });

    logger.info(
      {
        courseId: request.courseId,
        courseSlug: request.courseSlug,
        scope: request.scope,
        lectureId: request.lectureId,
        contentVersion: request.contentVersion,
        jobId,
        eventId: event.eventId,
      },
      '[COURSE_INDEXING_ENQUEUED]',
    );
  }
}

export const bullmqCourseKnowledgeIndexer = new BullmqCourseKnowledgeIndexer();
