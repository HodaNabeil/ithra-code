import { createCourseKnowledgeIndexer } from '@/ai-platform';
import { AITutorConfig } from '@/features/ai-tutor/infrastructure/config/ai-tutor.config';

export const bullmqCourseKnowledgeIndexer = createCourseKnowledgeIndexer({
  isEnabled: () => AITutorConfig.isEnabled(),
});

import {
  publishableCourseRepository,
  publishableLectureRepository,
} from '../repositories/publishable-course.repository';
import { courseCacheService } from '../services/course-cache.service';
import type { PublishCourseUseCaseDeps } from '../use-cases/publish-course.use-case';

export const defaultPublishCourseUseCaseDeps: PublishCourseUseCaseDeps = {
  courseRepository: publishableCourseRepository,
  lectureRepository: publishableLectureRepository,
  courseKnowledgeIndexer: bullmqCourseKnowledgeIndexer,
  cacheInvalidator: {
    async invalidateAfterCoursePublish(slug: string) {
      await courseCacheService.invalidateAfterArchive(slug);
    },
    async invalidateAfterLecturePublish(slug: string) {
      await courseCacheService.invalidateCourse(slug);
    },
  },
};
