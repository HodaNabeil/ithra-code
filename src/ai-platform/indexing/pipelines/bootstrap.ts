import { CourseStatus } from '@/generated/prisma/enums';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

import { AIPlatformConfig } from '../../infrastructure/config/ai-platform.config';
import { AI_PLATFORM_CONSTANTS } from '../../shared/constants';
import { bullmqCourseKnowledgeIndexer } from './enqueue';
import { reconcilePendingIndexingOutbox } from '../outbox/indexing-outbox.service';

export type BootstrapIndexingOptions = {
  isEnabled?: () => boolean;
};

/**
 * Enqueues indexing jobs for published courses that have never completed indexing.
 * Runs on worker startup so courses published before indexing was introduced still get indexed.
 */
export async function bootstrapUnindexedCourseIndexing(
  options: BootstrapIndexingOptions = {},
): Promise<number> {
  const isEnabled = options.isEnabled ?? (() => AIPlatformConfig.isEnabled());

  if (!isEnabled()) {
    return 0;
  }

  const lockAcquired = await redis.set(
    AI_PLATFORM_CONSTANTS.COURSE_INDEXING_BOOTSTRAP_LOCK_KEY,
    '1',
    'EX',
    AI_PLATFORM_CONSTANTS.COURSE_INDEXING_BOOTSTRAP_LOCK_TTL_SECONDS,
    'NX',
  );

  if (!lockAcquired) {
    logger.info(
      '[COURSE_INDEXING_BOOTSTRAP_SKIPPED] Another worker holds bootstrap lock',
    );
    return 0;
  }

  try {
    const unindexedCourses = await prisma.course.findMany({
      where: {
        status: CourseStatus.PUBLISHED,
        knowledgeIndexedAt: null,
      },
      select: {
        id: true,
        slug: true,
        updatedAt: true,
        instructorId: true,
      },
    });

    if (unindexedCourses.length === 0) {
      logger.info(
        '[COURSE_INDEXING_BOOTSTRAP] No unindexed published courses found',
      );
      return 0;
    }

    for (const course of unindexedCourses) {
      await bullmqCourseKnowledgeIndexer.scheduleIndexing({
        courseId: course.id,
        courseSlug: course.slug,
        scope: 'course',
        triggeredByUserId: course.instructorId,
        contentVersion: course.updatedAt.toISOString(),
      });
    }

    logger.info(
      {
        courseCount: unindexedCourses.length,
        courseSlugs: unindexedCourses.map((course) => course.slug),
      },
      '[COURSE_INDEXING_BOOTSTRAP] Enqueued indexing for unindexed published courses',
    );

    return unindexedCourses.length;
  } finally {
    await redis.del(AI_PLATFORM_CONSTANTS.COURSE_INDEXING_BOOTSTRAP_LOCK_KEY);
    await reconcilePendingIndexingOutbox();
  }
}
