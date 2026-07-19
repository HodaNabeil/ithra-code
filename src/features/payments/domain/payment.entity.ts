import type {
  Currency,
  PaymentProvider,
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
  createdAt: Date;
  updatedAt: Date;
  paidAt: Date | null;
};

export const TERMINAL_PAYMENT_STATUSES: readonly PaymentStatus[] = [
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
  'REFUNDED',
] as const;

export function isTerminalPaymentStatus(status: PaymentStatus): boolean {
  return TERMINAL_PAYMENT_STATUSES.includes(status);
}

export function isSuccessfulPayment(
  payment: Pick<PaymentEntity, 'status'>,
): boolean {
  return payment.status === 'SUCCEEDED';
}
