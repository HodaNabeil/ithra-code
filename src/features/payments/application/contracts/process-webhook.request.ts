import type { PaymentProvider } from '@/features/payments/domain';
import type { Currency } from '@/generated/prisma/enums';

export type ProcessWebhookOutcome = 'succeeded' | 'failed';

/** Input contract for processing a verified payment webhook. */
export type ProcessWebhookRequest = {
  provider: PaymentProvider;
  providerEventId: string;
  type: string;
  payload: unknown;
  outcome: ProcessWebhookOutcome;
  orderId: string;
  providerTransactionId: string;
  amountCents?: number | null;
  currency?: Currency | null;
  paymentMethod?: string | null;
  last4?: string | null;
  brand?: string | null;
  integrationId?: number | null;
  failureCode?: string | null;
  failureMessage?: string | null;
};
