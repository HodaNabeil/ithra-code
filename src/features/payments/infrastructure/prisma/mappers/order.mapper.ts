import type { Prisma } from '@prisma/client';
import type { OrderEntity, OrderItemEntity } from '@/features/payments/domain';
import type { DB_OrderWithItems } from '../order.select';

type DB_OrderItem = DB_OrderWithItems['items'][number];

/**
 * Translates between the Prisma `Order` model and the `OrderEntity` domain
 * aggregate. This mapper is an implementation detail of the Order repository.
 */
export const OrderMapper = {
  toDomain(db: DB_OrderWithItems): OrderEntity {
    return {
      id: db.id,
      orderNumber: db.orderNumber,
      userId: db.userId,
      subtotalCents: db.subtotalCents,
      discountCents: db.discountCents,
      taxCents: db.taxCents,
      totalCents: db.totalCents,
      currency: db.currency,
      status: db.status,
      couponId: db.couponId,
      couponCode: db.couponCode,
      checkoutFingerprint: db.checkoutFingerprint,
      paymentId: db.paymentId,
      createdAt: db.createdAt,
      updatedAt: db.updatedAt,
      completedAt: db.completedAt,
      items: db.items.map(OrderMapper.itemToDomain),
    };
  },

  itemToDomain(item: DB_OrderItem): OrderItemEntity {
    return {
      id: item.id,
      orderId: item.orderId,
      courseId: item.courseId,
      priceCents: item.priceCents,
      currency: item.currency,
      status: item.status,
      refundedAt: item.refundedAt,
    };
  },

  toCreateInput(order: OrderEntity): Prisma.OrderUncheckedCreateInput {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      subtotalCents: order.subtotalCents,
      discountCents: order.discountCents,
      taxCents: order.taxCents,
      totalCents: order.totalCents,
      currency: order.currency,
      status: order.status,
      couponId: order.couponId,
      couponCode: order.couponCode,
      checkoutFingerprint: order.checkoutFingerprint,
      paymentId: order.paymentId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      completedAt: order.completedAt,
      items: {
        create: order.items.map((item) => ({
          id: item.id,
          courseId: item.courseId,
          priceCents: item.priceCents,
          currency: item.currency,
          status: item.status,
          refundedAt: item.refundedAt,
        })),
      },
    };
  },
};
