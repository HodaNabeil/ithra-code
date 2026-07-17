import { prisma } from '@/lib/prisma';
import {
  PaymentProvider,
  PaymentStatus,
  Prisma,
} from '@prisma/client';

const TERMINAL_PAYMENT_STATUSES: PaymentStatus[] = [
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
  'REFUNDED',
];

export class PaymentService {
  static findByProviderTransaction(
    provider: PaymentProvider,
    providerTransactionId: string,
  ) {
    return prisma.payment.findUnique({
      where: {
        provider_providerTransactionId: {
          provider,
          providerTransactionId,
        },
      },
    });
  }

  static markPaymentSucceeded(
    paymentId: string,
    data: {
      providerTransactionId?: string;
      providerMetadata?: Prisma.InputJsonValue;
      paidAt?: Date;
      paymentMethod?: string;
      last4?: string;
      brand?: string;
    },
  ) {
    return prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'SUCCEEDED',
        providerTransactionId: data.providerTransactionId,
        providerMetadata: data.providerMetadata,
        paidAt: data.paidAt ?? new Date(),
        paymentMethod: data.paymentMethod,
        last4: data.last4,
        brand: data.brand,
        failureCode: null,
        failureMessage: null,
      },
    });
  }

  static markPaymentFailed(
    paymentId: string,
    data: { failureCode?: string; failureMessage?: string },
  ) {
    return prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'FAILED',
        failureCode: data.failureCode,
        failureMessage: data.failureMessage,
      },
    });
  }

  static markPaymentCancelled(paymentId: string) {
    return prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'CANCELLED' },
    });
  }

  static async markPaymentSucceededByProviderTransaction(
    provider: PaymentProvider,
    providerTransactionId: string,
    data: {
      providerMetadata?: Prisma.InputJsonValue;
      paidAt?: Date;
      paymentMethod?: string;
      last4?: string;
      brand?: string;
    },
  ) {
    const payment = await PaymentService.findByProviderTransaction(
      provider,
      providerTransactionId,
    );

    if (!payment) {
      return null;
    }

    if (payment.status === 'SUCCEEDED') {
      return payment;
    }

    return PaymentService.markPaymentSucceeded(payment.id, {
      providerTransactionId,
      ...data,
    });
  }

  static async markPaymentFailedByProviderTransaction(
    provider: PaymentProvider,
    providerTransactionId: string,
    data: { failureCode?: string; failureMessage?: string },
  ) {
    const payment = await PaymentService.findByProviderTransaction(
      provider,
      providerTransactionId,
    );

    if (!payment) {
      return null;
    }

    if (TERMINAL_PAYMENT_STATUSES.includes(payment.status)) {
      return payment;
    }

    return prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          failureCode: data.failureCode,
          failureMessage: data.failureMessage,
        },
      });

      await tx.order.updateMany({
        where: { paymentId: payment.id, status: 'PENDING' },
        data: { status: 'CANCELLED' },
      });

      return updatedPayment;
    });
  }

  static async markPaymentCancelledByProviderTransaction(
    provider: PaymentProvider,
    providerTransactionId: string,
  ) {
    const payment = await PaymentService.findByProviderTransaction(
      provider,
      providerTransactionId,
    );

    if (!payment) {
      return null;
    }

    if (TERMINAL_PAYMENT_STATUSES.includes(payment.status)) {
      return payment;
    }

    return prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'CANCELLED' },
      });

      await tx.order.updateMany({
        where: { paymentId: payment.id, status: 'PENDING' },
        data: { status: 'CANCELLED' },
      });

      return updatedPayment;
    });
  }

  static async processSuccessfulPayment(data: {
    userId: string;
    courseId: string;
    orderId: string;
    paymentId: string;
    stripePaymentIntent: string;
    providerMetadata?: Prisma.InputJsonValue;
  }) {
    const {
      userId,
      courseId,
      orderId,
      paymentId,
      stripePaymentIntent,
      providerMetadata,
    } = data;

    return await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'SUCCEEDED',
          providerTransactionId: stripePaymentIntent,
          providerMetadata,
          paidAt: new Date(),
          failureCode: null,
          failureMessage: null,
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

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
