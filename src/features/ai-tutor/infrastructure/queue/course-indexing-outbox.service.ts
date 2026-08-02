import { CourseIndexingOutboxStatus } from '@/generated/prisma/enums';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

import {
  addIndexingJobToQueue,
  buildIndexingEvent,
} from './course-indexing-queue';

export type IndexingOutboxRequest = {
  courseId: string;
  courseSlug: string;
  scope: 'course' | 'lecture';
  lectureId?: string;
  triggeredByUserId: string;
  contentVersion: string;
};

export async function recordIndexingOutboxEntry(
  request: IndexingOutboxRequest,
): Promise<string> {
  const entry = await prisma.courseIndexingOutbox.create({
    data: {
      courseId: request.courseId,
      courseSlug: request.courseSlug,
      scope: request.scope,
      lectureId: request.lectureId,
      contentVersion: request.contentVersion,
      triggeredByUserId: request.triggeredByUserId,
      status: CourseIndexingOutboxStatus.PENDING,
    },
  });

  return entry.id;
}

export async function markIndexingOutboxSent(outboxId: string): Promise<void> {
  await prisma.courseIndexingOutbox.update({
    where: { id: outboxId },
    data: {
      status: CourseIndexingOutboxStatus.SENT,
      attempts: { increment: 1 },
      lastError: null,
    },
  });
}

export async function markIndexingOutboxFailed(
  outboxId: string,
  error: unknown,
): Promise<void> {
  const message = error instanceof Error ? error.message : 'Unknown enqueue error';

  await prisma.courseIndexingOutbox.update({
    where: { id: outboxId },
    data: {
      status: CourseIndexingOutboxStatus.FAILED,
      attempts: { increment: 1 },
      lastError: message,
    },
  });
}

export async function enqueueIndexingFromOutbox(
  outboxId: string,
  request: IndexingOutboxRequest,
): Promise<void> {
  const event = buildIndexingEvent(request);

  try {
    await addIndexingJobToQueue(event);
    await markIndexingOutboxSent(outboxId);
  } catch (error) {
    await markIndexingOutboxFailed(outboxId, error);
    throw error;
  }
}

export async function reconcilePendingIndexingOutbox(limit = 50): Promise<number> {
  const pending = await prisma.courseIndexingOutbox.findMany({
    where: {
      status: {
        in: [CourseIndexingOutboxStatus.PENDING, CourseIndexingOutboxStatus.FAILED],
      },
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });

  let processed = 0;

  for (const entry of pending) {
    try {
      await enqueueIndexingFromOutbox(entry.id, {
        courseId: entry.courseId,
        courseSlug: entry.courseSlug,
        scope: entry.scope as 'course' | 'lecture',
        lectureId: entry.lectureId ?? undefined,
        triggeredByUserId: entry.triggeredByUserId,
        contentVersion: entry.contentVersion,
      });
      processed += 1;
    } catch (error) {
      logger.error(
        { outboxId: entry.id, courseId: entry.courseId, error },
        '[COURSE_INDEXING_OUTBOX_RECONCILE_FAILED]',
      );
    }
  }

  if (processed > 0) {
    logger.info(
      { processed, pendingCount: pending.length },
      '[COURSE_INDEXING_OUTBOX_RECONCILED]',
    );
  }

  return processed;
}
