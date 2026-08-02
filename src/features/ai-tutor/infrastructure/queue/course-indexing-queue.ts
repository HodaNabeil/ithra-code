import { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';

import { redis } from '@/lib/redis';

import type { CourseIndexingRequestedEvent } from '../../application/events/course-indexing-requested.event';
import {
  buildCourseIndexingJobId,
  COURSE_INDEXING_JOBS,
  COURSE_INDEXING_QUEUE,
} from './course-indexing.constants';

let courseIndexingQueue: Queue<CourseIndexingRequestedEvent> | null = null;

export function getCourseIndexingQueue(): Queue<CourseIndexingRequestedEvent> {
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

export function buildIndexingEvent(
  request: Pick<
    CourseIndexingRequestedEvent,
    'courseId' | 'courseSlug' | 'scope' | 'lectureId' | 'triggeredByUserId' | 'contentVersion'
  >,
): CourseIndexingRequestedEvent {
  return {
    eventId: randomUUID(),
    courseId: request.courseId,
    courseSlug: request.courseSlug,
    scope: request.scope,
    lectureId: request.lectureId,
    triggeredByUserId: request.triggeredByUserId,
    contentVersion: request.contentVersion,
    requestedAt: new Date().toISOString(),
  };
}

export async function addIndexingJobToQueue(
  event: CourseIndexingRequestedEvent,
): Promise<string> {
  const queue = getCourseIndexingQueue();
  const jobName =
    event.scope === 'lecture'
      ? COURSE_INDEXING_JOBS.INDEX_LECTURE
      : COURSE_INDEXING_JOBS.INDEX_COURSE;
  const jobId = buildCourseIndexingJobId(event);

  await queue.add(jobName, event, { jobId });
  return jobId;
}
