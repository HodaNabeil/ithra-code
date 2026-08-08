import { Worker } from 'bullmq';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';
import type { OrderCompletedEvent } from '@/features/payments/application/events/order-completed.event';
import { PostOrderFulfillmentService } from '@/features/payments/application/services/post-order-fulfillment.service';
import { loggingAnalyticsTracker } from '@/features/payments/infrastructure/analytics/logging-analytics.tracker';
import { pdfInvoiceGenerator } from '@/features/payments/infrastructure/invoicing/pdf-invoice.generator';
import {
  buildPurchaseConfirmationEmail,
  resendConfirmationEmailSender,
} from '@/features/payments/infrastructure/notifications/resend-email.sender';
import {
  ORDER_COMPLETED_JOBS,
  ORDER_COMPLETED_QUEUE,
} from '@/features/payments/infrastructure/queue/order-completed.publisher';

const postOrderFulfillmentService = new PostOrderFulfillmentService({
  confirmationEmailSender: resendConfirmationEmailSender,
  invoiceGenerator: pdfInvoiceGenerator,
  analyticsTracker: loggingAnalyticsTracker,
  loadConfirmationEmail: buildPurchaseConfirmationEmail,
  loadInvoiceInput: async (event) => {
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: event.orderId },
      select: { orderNumber: true },
    });

    return {
      orderId: event.orderId,
      orderNumber: order.orderNumber,
      userId: event.userId,
      totalCents: event.totalCents,
      currency: event.currency,
      purchasedCourseIds: event.purchasedCourseIds,
    };
  },
});

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
        await postOrderFulfillmentService.sendConfirmationEmail(event);
        return;

      case ORDER_COMPLETED_JOBS.GENERATE_INVOICE:
        await postOrderFulfillmentService.generateInvoice(event);
        return;

      case ORDER_COMPLETED_JOBS.TRACK_ANALYTICS:
        await postOrderFulfillmentService.trackAnalytics(event);
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
    '[ORDER_COMPLETED_DLQ]',
  );
});

export default worker;
