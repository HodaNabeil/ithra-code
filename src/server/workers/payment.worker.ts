import { Worker } from 'bullmq';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { buildStripeMetadata } from '@/types/payment/payment-metadata';

const worker = new Worker(
  'payment',
  async (job) => {
    logger.info({ jobId: job.id }, '🚀 Worker started processing payment job');
    const {
      orderId,
      userId,
      sessionId,
      paymentIntentId,
      amountTotal,
      brand,
      last4,
      paymentMethod,
    } = job.data;

    try {
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          status: true,
          paymentId: true,
          payment: { select: { status: true } },
        },
      });

      if (
        existingOrder?.status === 'COMPLETED' &&
        existingOrder.payment?.status === 'SUCCEEDED'
      ) {
        logger.info({ orderId }, 'Payment job already processed; skipping');
        return;
      }

      await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          select: { paymentId: true },
        });

        if (!order?.paymentId) {
          throw new Error(`Order ${orderId} has no linked payment`);
        }

        await tx.payment.update({
          where: { id: order.paymentId },
          data: {
            providerTransactionId: paymentIntentId,
            providerMetadata: buildStripeMetadata({
              ...(sessionId ? { stripeSessionId: sessionId } : {}),
              paymentIntentId,
            }),
            ...(amountTotal != null ? { amountCents: amountTotal } : {}),
            status: 'SUCCEEDED',
            provider: 'STRIPE',
            paidAt: new Date(),
            failureCode: null,
            failureMessage: null,
            ...(brand ? { brand } : {}),
            ...(last4 ? { last4 } : {}),
            ...(paymentMethod ? { paymentMethod } : {}),
          },
        });

        await tx.order.update({
          where: { id: orderId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });

        const orderItems = await tx.orderItem.findMany({
          where: { orderId },
          include: { course: { select: { slug: true } } },
        });

        for (const item of orderItems) {
          await tx.enrollment.upsert({
            where: {
              studentId_courseId: {
                studentId: userId,
                courseId: item.courseId,
              },
            },
            update: { status: 'ACTIVE' },
            create: {
              studentId: userId,
              courseId: item.courseId,
              status: 'ACTIVE',
              enrolledAt: new Date(),
            },
          });
        }

        await tx.cartItem.deleteMany({
          where: { cart: { userId } },
        });
      });

      logger.info({ orderId }, `✅ Order processed successfully in background`);
    } catch (error) {
      logger.error(
        { error, orderId, jobId: job.id },
        '❌ Failed to process payment job',
      );
      throw error;
    }
  },
  { connection: redis },
);

export default worker;

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed with error:`, err);
});
