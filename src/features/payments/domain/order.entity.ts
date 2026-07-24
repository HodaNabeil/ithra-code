import type {
  Currency,
  OrderItemStatus,
  OrderStatus,
} from '@/generated/prisma/enums';

export type OrderItemEntity = {
  id: string;
  orderId: string;
  courseId: string;
  priceCents: number;
  currency: Currency;
  status: OrderItemStatus;
  refundedAt: Date | null;
};

export type OrderEntity = {
  id: string;
  orderNumber: string;
  userId: string;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  currency: Currency;
  status: OrderStatus;
  couponId: string | null;
  couponCode: string | null;
  checkoutFingerprint: string | null;
  paymentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  items: OrderItemEntity[];
};

export function isOrderPayable(order: Pick<OrderEntity, 'status'>): boolean {
  return order.status === 'PENDING' || order.status === 'PROCESSING';
}

export function isOrderCompleted(order: Pick<OrderEntity, 'status'>): boolean {
  return order.status === 'COMPLETED';
}
