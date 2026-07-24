export type PaymentDomainEventType =
  | 'payment.settled'
  | 'payment.reconciliation.escalated'
  | 'payment.reconciliation.deferred'
  | 'payment.dispute.opened';

export type PaymentDomainEvent = {
  eventId: string;
  eventType: PaymentDomainEventType;
  aggregateId: string;
  occurredAt: string;
  payload: Record<string, unknown>;
};
