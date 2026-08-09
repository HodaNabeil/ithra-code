import { logger } from '@/lib/logger';

export type TutorRequestLogContext = {
  userId: string;
  courseSlug: string;
  lectureId?: string;
  durationMs: number;
  outcome: 'success' | 'error';
  usedFallback?: boolean;
  filterTriggered?: boolean;
  assessmentBlocked?: boolean;
  groundingBlocked?: boolean;
  grounded?: boolean;
  groundingReason?: string;
  retrievalChunkCount?: number;
  errorCode?: string;
};

export function logTutorRequestCompleted(context: TutorRequestLogContext): void {
  logger.info(
    {
      event: 'tutor.request.completed',
      ...context,
    },
    '[TUTOR_REQUEST_COMPLETED]',
  );
}

export function logTutorRequestFailed(
  context: Omit<TutorRequestLogContext, 'outcome'> & { errorCode: string },
): void {
  logger.error(
    {
      event: 'tutor.request.completed',
      outcome: 'error',
      ...context,
    },
    '[TUTOR_REQUEST_FAILED]',
  );
}
