import type { PaymentEntity } from '@/features/payments/domain';

export type MarkPaymentSucceededInput = {
  paymentId: string;
  providerTransactionId: string;
  providerMetadata?: unknown;
  paymentMethod?: string | null;
  last4?: string | null;
  brand?: string | null;
  integrationId?: number | null;
};

export type MarkPaymentFailedInput = {
  paymentId: string;
  providerTransactionId?: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  providerMetadata?: unknown;
};

/**
 * Persistence port for the Payment aggregate.
 * Owned by the Application layer; implemented in Infrastructure.
 */
export interface PaymentRepository {
  save(payment: PaymentEntity): Promise<PaymentEntity>;

  findById(paymentId: string): Promise<PaymentEntity | null>;

  /** Moves a payment to PROCESSING after a provider session was created. */
  markProcessing(paymentId: string): Promise<void>;

  markSucceeded(input: MarkPaymentSucceededInput): Promise<void>;

  markFailed(input: MarkPaymentFailedInput): Promise<void>;
}
