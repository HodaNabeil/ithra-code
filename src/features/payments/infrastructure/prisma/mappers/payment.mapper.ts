import { Prisma } from '@prisma/client';
import type { PaymentEntity } from '@/features/payments/domain';
import type { DB_Payment } from '../payment.select';

/**
 * Translates between the Prisma `Payment` model and the `PaymentEntity` domain
 * aggregate. This mapper is an implementation detail of the Payment repository.
 */
export const PaymentMapper = {
  toDomain(db: DB_Payment): PaymentEntity {
    return {
      id: db.id,
      provider: db.provider,
      providerTransactionId: db.providerTransactionId,
      providerMetadata: db.providerMetadata ?? null,
      amountCents: db.amountCents,
      currency: db.currency,
      status: db.status,
      paymentMethod: db.paymentMethod,
      integrationId: db.integrationId,
      last4: db.last4,
      brand: db.brand,
      failureCode: db.failureCode,
      failureMessage: db.failureMessage,
      createdAt: db.createdAt,
      updatedAt: db.updatedAt,
      paidAt: db.paidAt,
    };
  },

  toCreateInput(payment: PaymentEntity): Prisma.PaymentUncheckedCreateInput {
    return {
      id: payment.id,
      provider: payment.provider,
      providerTransactionId: payment.providerTransactionId,
      amountCents: payment.amountCents,
      currency: payment.currency,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      integrationId: payment.integrationId,
      last4: payment.last4,
      brand: payment.brand,
      failureCode: payment.failureCode,
      failureMessage: payment.failureMessage,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      paidAt: payment.paidAt,
      ...(payment.providerMetadata != null
        ? {
            providerMetadata:
              payment.providerMetadata as Prisma.InputJsonValue,
          }
        : {}),
    };
  },
};
