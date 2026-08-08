import type { WebhookEventEntity } from '@/features/payments/domain';

/**
 * Persistence port for the WebhookEvent aggregate.
 * The unique `(provider, providerEventId)` constraint is the idempotency key.
 */
export interface WebhookEventRepository {
  /**
   * Persists a webhook event. Throws when the unique constraint is violated
   * (duplicate delivery of the same provider event).
   */
  save(event: WebhookEventEntity): Promise<WebhookEventEntity>;
}
