import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { PaymentEntity } from '@/features/payments/domain';
import type {
  MarkPaymentFailedInput,
  MarkPaymentSucceededInput,
  PaymentRepository,
} from '@/features/payments/application/ports';
import { PaymentMapper } from '../mappers/payment.mapper';
import type { PrismaClientLike } from '../prisma.types';

/**
 * Prisma-backed implementation of the Payment persistence port.
 * Manages the Payment aggregate only.
 */
export class PrismaPaymentRepository implements PaymentRepository {
  constructor(private readonly db: PrismaClientLike = prisma) {}

  async save(payment: PaymentEntity): Promise<PaymentEntity> {
    const created = await this.db.payment.create({
      data: PaymentMapper.toCreateInput(payment),
    });

    return PaymentMapper.toDomain(created);
  }

  async findById(paymentId: string): Promise<PaymentEntity | null> {
    const payment = await this.db.payment.findUnique({
      where: { id: paymentId },
    });

    return payment ? PaymentMapper.toDomain(payment) : null;
  }

  async markProcessing(paymentId: string): Promise<void> {
    await this.db.payment.update({
      where: { id: paymentId },
      data: { status: 'PROCESSING' },
    });
  }

  async markSucceeded(input: MarkPaymentSucceededInput): Promise<void> {
    await this.db.payment.update({
      where: { id: input.paymentId },
      data: {
        status: 'SUCCEEDED',
        providerTransactionId: input.providerTransactionId,
        paidAt: new Date(),
        failureCode: null,
        failureMessage: null,
        ...(input.paymentMethod !== undefined
          ? { paymentMethod: input.paymentMethod }
          : {}),
        ...(input.last4 !== undefined ? { last4: input.last4 } : {}),
        ...(input.brand !== undefined ? { brand: input.brand } : {}),
        ...(input.integrationId !== undefined
          ? { integrationId: input.integrationId }
          : {}),
        ...(input.providerMetadata != null
          ? {
              providerMetadata:
                input.providerMetadata as Prisma.InputJsonValue,
            }
          : {}),
      },
    });
  }

  async markFailed(input: MarkPaymentFailedInput): Promise<void> {
    await this.db.payment.update({
      where: { id: input.paymentId },
      data: {
        status: 'FAILED',
        ...(input.providerTransactionId !== undefined
          ? { providerTransactionId: input.providerTransactionId }
          : {}),
        failureCode: input.failureCode ?? null,
        failureMessage: input.failureMessage ?? null,
        ...(input.providerMetadata != null
          ? {
              providerMetadata:
                input.providerMetadata as Prisma.InputJsonValue,
            }
          : {}),
      },
    });
  }
}

export const prismaPaymentRepository = new PrismaPaymentRepository();
