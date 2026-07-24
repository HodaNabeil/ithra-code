import { randomUUID } from 'node:crypto';
import type {
  OrderEntity,
  PaymentEntity,
  PaymentProvider,
} from '@/features/payments/domain';

export type CreatePaymentInput = {
  order: OrderEntity;
  provider: PaymentProvider;
};

/** Builds payment aggregates for checkout. */
export class PaymentFactory {
  /**
   * Creates a pending payment aggregate linked to the given order.
   * Does not interact with the database.
   */
  create(input: CreatePaymentInput): PaymentEntity {
    const now = new Date();

    return {
      id: randomUUID(),
      provider: input.provider,
      providerTransactionId: null,
      providerMetadata: null,
      amountCents: input.order.totalCents,
      currency: input.order.currency,
      status: 'PENDING',
      paymentMethod: null,
      integrationId: null,
      last4: null,
      brand: null,
      failureCode: null,
      failureMessage: null,
      reconcileStatus: 'IDLE',
      reconcileAttemptCount: 0,
      consecutiveNotFoundCount: 0,
      nextReconcileAt: null,
      reconcileLeaseExpiresAt: null,
      lastReconciledAt: null,
      lastProviderOutcome: null,
      lastProviderDetail: null,
      createdAt: now,
      updatedAt: now,
      paidAt: null,
    };
  }
}
