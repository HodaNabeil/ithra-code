import type { PaymentDomainEvent } from '../events/payment-domain.event';

/**
 * Outbox port for reliable domain event delivery (transactional outbox pattern).
 */
export interface PaymentDomainOutbox {
  enqueue(event: PaymentDomainEvent): Promise<void>;
}
