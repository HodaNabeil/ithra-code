import { Worker } from 'bullmq';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';
import type { OrderCompletedEvent } from '@/features/payments/application/events/order-completed.event';
import {
  ORDER_COMPLETED_JOBS,
  ORDER_COMPLETED_QUEUE,
} from '@/features/payments/infrastructure/queue/order-completed.publisher';

/**
 * Secondary (non-critical) post-fulfillment workers.
 * Failures are retried by BullMQ and never affect enrollment status.
 */
const worker = new Worker<OrderCompletedEvent>(
  ORDER_COMPLETED_QUEUE,
  async (job) => {
    const event = job.data;

    switch (job.name) {
      case ORDER_COMPLETED_JOBS.SEND_CONFIRMATION_EMAIL:
        logger.info(
          { orderId: event.orderId, userId: event.userId },
          '[ORDER_COMPLETED] confirmation email queued (stub)',
        );
        // TODO: integrate email provider (Resend/SendGrid) with localized template.
        return;

      case ORDER_COMPLETED_JOBS.GENERATE_INVOICE:
        logger.info(
          { orderId: event.orderId, totalCents: event.totalCents },
          '[ORDER_COMPLETED] invoice generation queued (stub)',
        );
        // TODO: generate PDF invoice and store in object storage.
        return;

      case ORDER_COMPLETED_JOBS.TRACK_ANALYTICS:
        logger.info(
          {
            orderId: event.orderId,
            courses: event.purchasedCourseIds,
          },
          '[ORDER_COMPLETED] analytics dispatch queued (stub)',
        );
        // TODO: push purchase event to analytics platforms.
        return;

      default:
        logger.warn(
          { jobName: job.name, orderId: event.orderId },
          '[ORDER_COMPLETED] unknown job name',
        );
    }
  },
  { connection: redis },
);

worker.on('failed', (job, err) => {
  logger.error(
    { jobId: job?.id, jobName: job?.name, err },
    '[ORDER_COMPLETED_WORKER_FAILED]',
  );
});

export default worker;
