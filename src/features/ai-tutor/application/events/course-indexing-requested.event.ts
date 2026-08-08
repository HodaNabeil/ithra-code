import type { CourseKnowledgeIndexingScope } from '@/features/courses/application/ports/course-knowledge-indexer.port';

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
