import type { CourseKnowledgeIndexerPort } from '@/features/courses/application/ports/course-knowledge-indexer.port';
import { logger } from '@/lib/logger';

const INDEXING_ENQUEUE_MAX_ATTEMPTS = 3;
const INDEXING_ENQUEUE_RETRY_DELAY_MS = 500;

const INDEXING_WARNING_MESSAGE =
  'تم نشر الدورة بنجاح، لكن فشل جدولة فهرسة محتوى المدرس الذكي. يُرجى إعادة النشر أو تشغيل الفهرسة اليدوية.';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function scheduleIndexingWithRetry(
  schedule: () => Promise<void>,
  logContext: Record<string, unknown>,
  logTag: string,
): Promise<string | undefined> {
  for (
    let attempt = 1;
    attempt <= INDEXING_ENQUEUE_MAX_ATTEMPTS;
    attempt += 1
  ) {
    try {
      await schedule();
      return undefined;
    } catch (error) {
      if (attempt === INDEXING_ENQUEUE_MAX_ATTEMPTS) {
        logger.error(
          {
            ...logContext,
            error,
            attempt,
            alert: true,
          },
          logTag,
        );
        return INDEXING_WARNING_MESSAGE;
      }

      await sleep(INDEXING_ENQUEUE_RETRY_DELAY_MS * attempt);
    }
  }

  return INDEXING_WARNING_MESSAGE;
}

export async function scheduleCourseIndexing(params: {
  courseId: string;
  courseSlug: string;
  triggeredByUserId: string;
  contentVersion: string;
  indexer: CourseKnowledgeIndexerPort;
}): Promise<string | undefined> {
  return scheduleIndexingWithRetry(
    () =>
      params.indexer.scheduleIndexing({
        courseId: params.courseId,
        courseSlug: params.courseSlug,
        scope: 'course',
        triggeredByUserId: params.triggeredByUserId,
        contentVersion: params.contentVersion,
      }),
    {
      courseId: params.courseId,
      courseSlug: params.courseSlug,
    },
    '[PUBLISH_COURSE_INDEXING_ENQUEUE_FAILED]',
  );
}

export async function scheduleLectureIndexing(params: {
  courseId: string;
  courseSlug: string;
  lectureId: string;
  triggeredByUserId: string;
  contentVersion: string;
  indexer: CourseKnowledgeIndexerPort;
}): Promise<string | undefined> {
  return scheduleIndexingWithRetry(
    () =>
      params.indexer.scheduleIndexing({
        courseId: params.courseId,
        courseSlug: params.courseSlug,
        scope: 'lecture',
        lectureId: params.lectureId,
        triggeredByUserId: params.triggeredByUserId,
        contentVersion: params.contentVersion,
      }),
    {
      courseId: params.courseId,
      lectureId: params.lectureId,
    },
    '[PUBLISH_LECTURE_INDEXING_ENQUEUE_FAILED]',
  );
}
