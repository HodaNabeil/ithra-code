import { prisma } from '@/lib/prisma';

export class PaymentService {
  static async processSuccessfulPayment(data: {
    userId: string;
    courseId: string;
    orderId: string;
    paymentId: string;
    stripePaymentIntent: string;
  }) {
    const { userId, courseId, orderId, paymentId, stripePaymentIntent } = data;

    return await prisma.$transaction(async (tx) => {
      // 1. Update Payment status
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'SUCCEEDED',
          providerTransactionId: stripePaymentIntent,
          paidAt: new Date(),
        },
      });

      // 2. Update Order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // 3. Create or update Enrollment
      await tx.enrollment.upsert({
        where: {
          studentId_courseId: {
            studentId: userId,
            courseId: courseId,
          },
        },
        create: {
          studentId: userId,
          courseId: courseId,
          status: 'ACTIVE',
        },
        update: { status: 'ACTIVE' },
      });
    });
  }
}
