import { AITutorConfig } from '../config/ai-tutor.config';
import { bootstrapUnindexedCourseIndexing as platformBootstrap } from '@/ai-platform/indexing/pipelines/bootstrap';

/**
 * Enqueues indexing jobs for published courses that have never completed indexing.
 */
export async function bootstrapUnindexedCourseIndexing(): Promise<number> {
  return platformBootstrap({
    isEnabled: () => AITutorConfig.isEnabled(),
  });
}
