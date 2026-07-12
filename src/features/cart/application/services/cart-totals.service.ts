import type { CartRepository } from '../../domain/repositories/cart.repository';
import type { DB_CartWithItems } from '../../infrastructure/prisma/cart.select';
import {
  calculateDiscount,
  isCouponValid,
} from '../../mappers/cart.mapper';

export type CartTotalsResult = {
  subtotal: number;
  discount: number;
  total: number;
  couponCleared: boolean;
};

/** Recalculates and persists cart subtotal, discount, and total from item snapshots. */
export async function recalculateCartTotals(
  cart: DB_CartWithItems,
  repository: CartRepository,
): Promise<CartTotalsResult> {
  const subtotal = parseFloat(
    cart.items
      .reduce((acc, item) => acc + Number(item.price), 0)
      .toFixed(2),
  );

  let discount = 0;
  let couponCleared = false;
  const coupon = cart.coupon;

  if (coupon) {
    if (isCouponValid(coupon, subtotal)) {
      discount = calculateDiscount(subtotal, coupon);
    } else {
      await repository.clearCoupon(cart.id);
      couponCleared = true;
    }
  }

  const total = parseFloat(Math.max(subtotal - discount, 0).toFixed(2));

  const storedSubtotal = Number(cart.subtotal);
  const storedDiscount = Number(cart.discount);
  const storedTotal = Number(cart.total);

  if (
    storedSubtotal !== subtotal ||
    storedDiscount !== discount ||
    storedTotal !== total
  ) {
    await repository.updateTotals(cart.id, { subtotal, discount, total });
  }

  return { subtotal, discount, total, couponCleared };
}
