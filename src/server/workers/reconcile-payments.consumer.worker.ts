import { Worker } from 'bullmq';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { createReconcilePaymentsUseCase } from '@/features/payments/infrastructure/di/payments.container';
import {
  RECONCILE_PAYMENTS_QUEUE,
  type ReconcilePaymentJobData,
} from '@/features/payments/infrastructure/queue/reconcile-payments.publisher';

/**
 * BullMQ consumer for per-payment reconciliation jobs.
 * Run alongside or instead of the polling scheduler when queue mode is enabled.
 */
const worker = new Worker<ReconcilePaymentJobData>(
  RECONCILE_PAYMENTS_QUEUE,
  async (job) => {
    const useCase = createReconcilePaymentsUseCase();
    await useCase.processPayment(job.data.paymentId, job.data.correlationId);
  },
  {
    connection: redis,
    concurrency: 5,
  },
);

worker.on('failed', (job, err) => {
  logger.error(
    { jobId: job?.id, paymentId: job?.data.paymentId, err },
    '[RECONCILE_PAYMENT_DLQ]',
  );
});

export default worker;
