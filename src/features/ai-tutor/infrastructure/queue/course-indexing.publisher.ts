import type { CourseKnowledgeIndexerPort } from '@/features/courses/application/ports/course-knowledge-indexer.port';
import { logger } from '@/lib/logger';

import { AITutorConfig } from '../config/ai-tutor.config';
import {
  markIndexingOutboxFailed,
  markIndexingOutboxSent,
  recordIndexingOutboxEntry,
} from './course-indexing-outbox.service';
import {
  addIndexingJobToQueue,
  buildIndexingEvent,
} from './course-indexing-queue';

export {
  buildCourseIndexingJobId,
  COURSE_INDEXING_JOBS,
  COURSE_INDEXING_QUEUE,
} from './course-indexing.constants';

/**
 * Publishes course/lecture indexing work to BullMQ with outbox durability.
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

    const outboxId = await recordIndexingOutboxEntry({
      courseId: request.courseId,
      courseSlug: request.courseSlug,
      scope: request.scope,
      lectureId: request.lectureId,
      triggeredByUserId: request.triggeredByUserId,
      contentVersion: request.contentVersion,
    });

    const event = buildIndexingEvent(request);

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
