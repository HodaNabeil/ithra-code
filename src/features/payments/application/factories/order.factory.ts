import { randomUUID } from 'node:crypto';
import type { OrderEntity } from '@/features/payments/domain';
import type { PriceCalculationResult } from '../services/price-calculator.service';

export type CreateOrderInput = {
  userId: string;
  pricing: PriceCalculationResult;
};

/** Builds immutable order aggregates with price snapshots. */
export class OrderFactory {
  /**
   * Creates an in-memory order aggregate ready for persistence.
   * Does not interact with the database.
   */
  create(input: CreateOrderInput): OrderEntity {
    const now = new Date();
    const orderId = randomUUID();

    return {
      id: orderId,
      orderNumber: this.generateOrderNumber(),
      userId: input.userId,
      subtotalCents: input.pricing.subtotalCents,
      discountCents: input.pricing.discountCents,
      taxCents: input.pricing.taxCents,
      totalCents: input.pricing.totalCents,
      currency: input.pricing.currency,
      status: 'PENDING',
      couponId: input.pricing.couponId,
      couponCode: input.pricing.couponCode,
      paymentId: null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      items: input.pricing.items.map((item) => ({
        id: randomUUID(),
        orderId,
        courseId: item.courseId,
        priceCents: item.priceCents,
        currency: item.currency,
        status: 'ACTIVE',
        refundedAt: null,
      })),
    };
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const suffix = randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();

    return `ORD-${timestamp}-${suffix}`;
  }
}
