import type {
  Currency,
  PaymentProvider,
  PaymentReconcileStatus,
  PaymentStatus,
} from '@/generated/prisma/enums';

export type PaymentEntity = {
  id: string;
  provider: PaymentProvider;
  providerTransactionId: string | null;
  providerMetadata: unknown;
  amountCents: number;
  currency: Currency;
  status: PaymentStatus;
  paymentMethod: string | null;
  integrationId: number | null;
  last4: string | null;
  brand: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  reconcileStatus: PaymentReconcileStatus;
  reconcileAttemptCount: number;
  consecutiveNotFoundCount: number;
  nextReconcileAt: Date | null;
  reconcileLeaseExpiresAt: Date | null;
  lastReconciledAt: Date | null;
  lastProviderOutcome: string | null;
  lastProviderDetail: string | null;
  createdAt: Date;
  updatedAt: Date;
  paidAt: Date | null;
};

export const TERMINAL_PAYMENT_STATUSES: readonly PaymentStatus[] = [
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
  'REFUNDED',
  'VOIDED',
  'PARTIALLY_REFUNDED',
] as const;

/** Statuses that may transition to SUCCEEDED or FAILED via fulfillment. */
export const FULFILLABLE_PAYMENT_STATUSES: readonly PaymentStatus[] = [
  'PENDING',
  'PROCESSING',
] as const;

export function isTerminalPaymentStatus(status: PaymentStatus): boolean {
  return TERMINAL_PAYMENT_STATUSES.includes(status);
}

export function isSuccessfulPayment(
  payment: Pick<PaymentEntity, 'status'>,
): boolean {
  return payment.status === 'SUCCEEDED';
}
