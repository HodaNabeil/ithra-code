import { Queue } from 'bullmq';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';
import type { OrderCompletedEvent } from '@/features/payments/application/events/order-completed.event';
import type { OrderCompletedPublisher } from '@/features/payments/application/ports';

export const ORDER_COMPLETED_QUEUE = 'order-completed';

export const ORDER_COMPLETED_JOBS = {
  SEND_CONFIRMATION_EMAIL: 'send-confirmation-email',
  GENERATE_INVOICE: 'generate-invoice',
  TRACK_ANALYTICS: 'track-analytics',
} as const;

let orderCompletedQueue: Queue | null = null;

function getOrderCompletedQueue(): Queue {
  orderCompletedQueue ??= new Queue(ORDER_COMPLETED_QUEUE, {
    connection: redis,
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 60_000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  });

  return orderCompletedQueue;
}

/**
 * Publishes `OrderCompleted` secondary work to BullMQ.
 * Failures here must never roll back fulfillment (caller catches / logs).
 */
export class BullmqOrderCompletedPublisher implements OrderCompletedPublisher {
  async publish(event: OrderCompletedEvent): Promise<void> {
    try {
      const queue = getOrderCompletedQueue();
      const baseId = `order-completed_${event.orderId}_${event.eventId}`;

      await Promise.all([
        queue.add(ORDER_COMPLETED_JOBS.SEND_CONFIRMATION_EMAIL, event, {
          jobId: `${baseId}_email`,
        }),
        queue.add(ORDER_COMPLETED_JOBS.GENERATE_INVOICE, event, {
          jobId: `${baseId}_invoice`,
        }),
        queue.add(ORDER_COMPLETED_JOBS.TRACK_ANALYTICS, event, {
          jobId: `${baseId}_analytics`,
        }),
      ]);
    } catch (error) {
      logger.error(
        { error, orderId: event.orderId },
        '[ORDER_COMPLETED_PUBLISH_FAILED]',
      );
      throw error;
    }
  }
}

export const bullmqOrderCompletedPublisher =
  new BullmqOrderCompletedPublisher();
