import type { OrderEntity, PaymentEntity } from '@/features/payments/domain';
import type { CheckoutSessionEntity } from '@/features/payments/domain';

export type ReusablePendingOrder = {
  order: OrderEntity;
  payment: PaymentEntity;
  checkoutSession: CheckoutSessionEntity;
};

/**
 * Persistence port for the Order aggregate.
 * Owned by the Application layer; implemented in Infrastructure.
 */
export interface OrderRepository {
  save(order: OrderEntity): Promise<OrderEntity>;

  findById(orderId: string): Promise<OrderEntity | null>;

  findReusablePendingOrder(input: {
    userId: string;
    checkoutFingerprint: string;
  }): Promise<ReusablePendingOrder | null>;

  /** Transitions an order to COMPLETED and stamps `completedAt`. */
  markCompleted(orderId: string): Promise<void>;
}
