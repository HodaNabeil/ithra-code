import type { DB_CartWithItems } from '@/features/cart/infrastructure/prisma/cart.select';
import type { CheckoutCartSnapshot } from '../validators/checkout.validator';

/**
 * Maps the persisted cart model into a checkout validation snapshot.
 * `instructorId` is provided by the cart course select.
 */
export function mapCartToCheckoutSnapshot(
  cart: DB_CartWithItems,
): CheckoutCartSnapshot {
  return {
    id: cart.id,
    userId: cart.userId,
    currency: cart.currency,
    coupon: cart.coupon,
    items: cart.items.map((item) => ({
      courseId: item.courseId,
      price: Number(item.price),
      currency: item.currency,
      course: item.course
        ? {
            id: item.course.id,
            instructorId: item.course.instructorId,
            price: Number(item.course.price),
            currency: item.course.currency,
            status: item.course.status,
            visibility: item.course.visibility,
          }
        : null,
    })),
  };
}
