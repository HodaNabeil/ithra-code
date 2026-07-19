import type { DB_CartWithItems } from '@/features/cart/infrastructure/prisma/cart.select';
import type { CheckoutCartSnapshot } from '../validators/checkout.validator';

/**
 * Maps the persisted cart model into a checkout validation snapshot.
 * TODO: Include `instructorId` in the cart query select for checkout.
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
            // TODO: Load instructorId from cart/course repository at infrastructure layer.
            instructorId: readInstructorId(item.course),
            price: Number(item.course.price),
            currency: item.course.currency,
            status: item.course.status,
            visibility: item.course.visibility,
          }
        : null,
    })),
  };
}

function readInstructorId(
  course: DB_CartWithItems['items'][number]['course'],
): string {
  const instructorId = (course as { instructorId?: string }).instructorId;

  if (!instructorId) {
    return '';
  }

  return instructorId;
}
