import type { CourseIndexingRequestedEvent } from '../../application/events/course-indexing-requested.event';

export const COURSE_INDEXING_QUEUE = 'course-indexing';

export const COURSE_INDEXING_JOBS = {
  INDEX_COURSE: 'index-course',
  INDEX_LECTURE: 'index-lecture',
} as const;

export const COURSE_INDEXING_BOOTSTRAP_LOCK_KEY = 'course-indexing:bootstrap:lock';
export const COURSE_INDEXING_BOOTSTRAP_LOCK_TTL_SECONDS = 300;

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
