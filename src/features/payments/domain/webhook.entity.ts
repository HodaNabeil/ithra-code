import type { PaymentProvider } from './payment-provider';

export type WebhookEventEntity = {
  id: string;
  provider: PaymentProvider;
  type: string;
  providerEventId: string;
  receivedAt: Date;
  payload: unknown;
};

export type WebhookVerificationInput = {
  provider: PaymentProvider;
  rawBody: string;
  signature: string;
};

export function createWebhookEventEntity(input: {
  provider: PaymentProvider;
  type: string;
  providerEventId: string;
  payload: unknown;
}): WebhookEventEntity {
  return {
    id: `${input.provider}_${input.providerEventId}`,
    provider: input.provider,
    type: input.type,
    providerEventId: input.providerEventId,
    receivedAt: new Date(),
    payload: input.payload,
  };
}
