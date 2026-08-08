import type { CartFulfillmentRepository } from './cart-fulfillment.repository';
import type { CheckoutSessionRepository } from './checkout-session.repository';
import type { EnrollmentRepository } from './enrollment.repository';
import type { OrderRepository } from './order.repository';
import type { PaymentRepository } from './payment.repository';
import type { WebhookEventRepository } from './webhook-event.repository';

/**
 * The repository bundle bound to a single database transaction.
 * Every repository here writes through the same transactional client.
 */
export interface TransactionalRepositories {
  readonly orders: OrderRepository;
  readonly payments: PaymentRepository;
  readonly checkoutSessions: CheckoutSessionRepository;
  readonly webhookEvents: WebhookEventRepository;
  readonly enrollments: EnrollmentRepository;
  readonly carts: CartFulfillmentRepository;
}

/**
 * Coordinates atomic transactions across repositories.
 *
 * The Application layer owns this abstraction; the Infrastructure layer
 * provides the concrete transaction boundary (e.g. `prisma.$transaction`).
 * The Application must never see the underlying database client.
 */
export interface UnitOfWork {
  /**
   * Runs `work` inside a single transaction. The transaction commits when the
   * callback resolves and rolls back if it throws.
   */
  execute<T>(
    work: (repositories: TransactionalRepositories) => Promise<T>,
  ): Promise<T>;
}
