import type { CourseKnowledgeIndexingScope } from '@/features/courses/application/ports/course-knowledge-indexer.port';

import { AI_PLATFORM_CONSTANTS } from '../shared/constants';

export const COURSE_INDEXING_QUEUE = AI_PLATFORM_CONSTANTS.COURSE_INDEXING_QUEUE;

export const COURSE_INDEXING_BOOTSTRAP_LOCK_KEY =
  AI_PLATFORM_CONSTANTS.COURSE_INDEXING_BOOTSTRAP_LOCK_KEY;
export const COURSE_INDEXING_BOOTSTRAP_LOCK_TTL_SECONDS =
  AI_PLATFORM_CONSTANTS.COURSE_INDEXING_BOOTSTRAP_LOCK_TTL_SECONDS;

export const COURSE_INDEXING_JOBS = {
  INDEX_COURSE: 'index-course',
  INDEX_LECTURE: 'index-lecture',
} as const;

export type CourseIndexingRequestedEvent = {
  eventId: string;
  courseId: string;
  courseSlug: string;
  scope: CourseKnowledgeIndexingScope;
  lectureId?: string;
  triggeredByUserId: string;
  contentVersion: string;
  requestedAt: string;
};

function sanitizeJobIdPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * Stable BullMQ job id keyed by scope + content version for queue-level deduplication.
 */
export function buildCourseIndexingJobId(request: {
  scope: CourseIndexingRequestedEvent['scope'];
  courseId: string;
  lectureId?: string;
  contentVersion: string;
}): string {
  const version = sanitizeJobIdPart(request.contentVersion);

  if (request.scope === 'lecture' && request.lectureId) {
    return `index-lecture_${request.lectureId}_${version}`;
  }

  return `index-course_${request.courseId}_${version}`;
}
