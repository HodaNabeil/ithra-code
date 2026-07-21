import type { CheckoutSessionEntity } from '@/features/payments/domain';

/**
 * Persistence port for the CheckoutSession aggregate.
 * Owned by the Application layer; implemented in Infrastructure.
 */
export interface CheckoutSessionRepository {
  save(session: CheckoutSessionEntity): Promise<CheckoutSessionEntity>;
}
