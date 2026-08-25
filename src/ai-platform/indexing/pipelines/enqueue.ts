import type { CourseKnowledgeIndexerPort } from '@/features/courses/application/ports/course-knowledge-indexer.port';
import { logger } from '@/lib/logger';

import { AIPlatformConfig } from '../../infrastructure/config/ai-platform.config';
import {
  markIndexingOutboxFailed,
  markIndexingOutboxSent,
  recordIndexingOutboxEntry,
} from '../outbox/indexing-outbox.service';
import {
  addIndexingJobToQueue,
  buildIndexingEvent,
} from '../../infrastructure/queue/course-indexing.queue';

export {
  buildCourseIndexingJobId,
  COURSE_INDEXING_JOBS,
  COURSE_INDEXING_QUEUE,
} from '../constants';

/**
 * Publishes course/lecture indexing work to BullMQ with outbox durability.
 */
export type CourseKnowledgeIndexerOptions = {
  isEnabled?: () => boolean;
};

export class BullmqCourseKnowledgeIndexer implements CourseKnowledgeIndexerPort {
  constructor(private readonly options: CourseKnowledgeIndexerOptions = {}) {}

  async scheduleIndexing(
    request: Parameters<CourseKnowledgeIndexerPort['scheduleIndexing']>[0],
  ): Promise<void> {
    const isEnabled =
      this.options.isEnabled ?? (() => AIPlatformConfig.isEnabled());

    if (!isEnabled()) {
      logger.info(
        { courseId: request.courseId, scope: request.scope },
        '[COURSE_INDEXING_SKIPPED] Indexing disabled',
      );
      return;
    }

    const outboxId = await recordIndexingOutboxEntry({
      courseId: request.courseId,
      courseSlug: request.courseSlug,
      scope: request.scope,
      lectureId: request.lectureId,
      triggeredByUserId: request.triggeredByUserId,
      contentVersion: request.contentVersion,
    });

    const event = buildIndexingEvent({ ...request, outboxId });

    try {
      const jobId = await addIndexingJobToQueue(event);
      await markIndexingOutboxSent(outboxId);

      logger.info(
        {
          courseId: request.courseId,
          courseSlug: request.courseSlug,
          scope: request.scope,
          lectureId: request.lectureId,
          contentVersion: request.contentVersion,
          jobId,
          eventId: event.eventId,
          outboxId,
        },
        '[COURSE_INDEXING_ENQUEUED]',
      );
    } catch (error) {
      await markIndexingOutboxFailed(outboxId, error);
      throw error;
    }
  }
}

export const bullmqCourseKnowledgeIndexer = new BullmqCourseKnowledgeIndexer();

export function createCourseKnowledgeIndexer(
  options: CourseKnowledgeIndexerOptions,
): BullmqCourseKnowledgeIndexer {
  return new BullmqCourseKnowledgeIndexer(options);
}
