import { AITutorConfig } from '../config/ai-tutor.config';
import {
  createCourseKnowledgeIndexer,
  BullmqCourseKnowledgeIndexer,
} from '@/ai-platform/indexing/pipelines/enqueue';

export {
  buildCourseIndexingJobId,
  COURSE_INDEXING_JOBS,
  COURSE_INDEXING_QUEUE,
} from '@/ai-platform/indexing/pipelines/enqueue';

export const bullmqCourseKnowledgeIndexer = createCourseKnowledgeIndexer({
  isEnabled: () => AITutorConfig.isEnabled(),
});

export { BullmqCourseKnowledgeIndexer };
