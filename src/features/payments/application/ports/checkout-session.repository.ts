import type { CheckoutSessionEntity } from '@/features/payments/domain';

/**
 * Persistence port for the CheckoutSession aggregate.
 * Owned by the Application layer; implemented in Infrastructure.
 */
export interface CheckoutSessionRepository {
  save(session: CheckoutSessionEntity): Promise<CheckoutSessionEntity>;

  findOpenByOrderId(orderId: string): Promise<CheckoutSessionEntity | null>;

  markExpired(sessionId: string): Promise<void>;
}
