import { Queue } from 'bullmq';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

export const RECONCILE_PAYMENTS_QUEUE = 'reconcile-payments';

export type ReconcilePaymentJobData = {
  paymentId: string;
  correlationId: string;
};

let reconcileQueue: Queue<ReconcilePaymentJobData> | null = null;

function getReconcileQueue(): Queue<ReconcilePaymentJobData> {
  reconcileQueue ??= new Queue(RECONCILE_PAYMENTS_QUEUE, {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 30_000 },
      removeOnComplete: true,
      removeOnFail: false,
    },
  });

  return reconcileQueue;
}

export class BullmqReconcilePaymentsPublisher {
  async enqueue(data: ReconcilePaymentJobData): Promise<void> {
    try {
      const queue = getReconcileQueue();
      await queue.add('reconcile-payment', data, {
        jobId: `reconcile_${data.paymentId}_${data.correlationId}`,
      });
    } catch (error) {
      logger.error(
        { error, paymentId: data.paymentId },
        '[RECONCILE_PAYMENT_ENQUEUE_FAILED]',
      );
      throw error;
    }
  }

  async enqueueBatch(jobs: ReconcilePaymentJobData[]): Promise<void> {
    await Promise.all(jobs.map((job) => this.enqueue(job)));
  }
}

export const bullmqReconcilePaymentsPublisher =
  new BullmqReconcilePaymentsPublisher();
