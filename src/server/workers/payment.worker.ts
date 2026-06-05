import { Worker } from 'bullmq';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';
const worker = new Worker(
  'payment',
  async (job) => {
    logger.info({ jobId: job.id }, '🚀 Worker started processing payment job');
    const { orderId, userId, sessionId, paymentIntentId, amountTotal } =
      job.data;

    try {
      await prisma.$transaction(async (tx) => {
        // 1. Create the Payment record
        const payment = await tx.payment.create({
          data: {
            stripePaymentIntentId: paymentIntentId,
            stripeSessionId: sessionId,
            amountCents: amountTotal,
            status: 'SUCCEEDED',
            provider: 'STRIPE',
            paidAt: new Date(),
          },
        });

        // 2. Update the Order
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: 'COMPLETED',
            paymentId: payment.id,
            completedAt: new Date(),
          },
        });

        // 3. Create Enrollments
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

        // 4. Clear the Cart
        await tx.cartItem.deleteMany({
          where: { cart: { userId: userId } },
        });
      });

      logger.info({ orderId }, `✅ Order processed successfully in background`);
    } catch (error) {
      logger.error(
        { error, orderId, jobId: job.id },
        '❌ Failed to process payment job',
      );
      throw error; // Let BullMQ handle the retry
    }
  },
  { connection: redis },
);

export default worker;

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed with error:`, err); // غيري السطر ده عشان تشوفي التفاصيل
});
