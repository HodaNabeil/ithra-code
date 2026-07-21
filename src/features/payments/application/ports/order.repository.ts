import type { OrderEntity } from '@/features/payments/domain';

/**
 * Persistence port for the Order aggregate.
 * Owned by the Application layer; implemented in Infrastructure.
 */
export interface OrderRepository {
  save(order: OrderEntity): Promise<OrderEntity>;

  findById(orderId: string): Promise<OrderEntity | null>;

  /** Transitions an order to COMPLETED and stamps `completedAt`. */
  markCompleted(orderId: string): Promise<void>;
}
