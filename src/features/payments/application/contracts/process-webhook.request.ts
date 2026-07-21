import type { PaymentProvider } from '@/features/payments/domain';

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
  paymentMethod?: string | null;
  last4?: string | null;
  brand?: string | null;
  integrationId?: number | null;
  failureCode?: string | null;
  failureMessage?: string | null;
};
