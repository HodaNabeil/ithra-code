export type CourseKnowledgeIndexingScope = 'course' | 'lecture';

export type CourseKnowledgeIndexingRequest = {
  courseId: string;
  courseSlug: string;
  scope: CourseKnowledgeIndexingScope;
  lectureId?: string;
  triggeredByUserId: string;
  /** Used for idempotent queue job keys. */
  contentVersion: string;
};

/**
 * Schedules AI Tutor knowledge indexing after course content is published.
 * Implementations must not throw back into the publish transaction path.
 */
export interface CourseKnowledgeIndexerPort {
  scheduleIndexing(request: CourseKnowledgeIndexingRequest): Promise<void>;
}
