import type { CartDataType } from '@/types/cart/cart';
import {
  calculateDiscount,
  emptyCartDto,
  isCouponValid,
  isCourseAvailable,
  mapCartToDto,
} from '../mappers/cart.mapper';
import type { CartRepository } from '../domain/repositories/cart.repository';
import { cartRepository } from '../infrastructure/prisma/repositories/prisma-cart.repository';
import { addCartItemUseCase } from '../application/use-cases/add-cart-item.use-case';

export { CartError, CartServiceError } from '../domain/errors/cart.errors';
import type { DB_CartWithItems } from '../infrastructure/prisma/cart.select';

async function reconcileCart(
  userId: string,
  dbCart: DB_CartWithItems,
  repository: CartRepository = cartRepository,
): Promise<CartDataType> {
  const warnings: string[] = [];
  const courseIds = dbCart.items.map((item) => item.courseId);

  const enrolledCourseIds = await repository.findActiveEnrollmentCourseIds(
    userId,
    courseIds,
  );

  const staleCourseIds = dbCart.items
    .filter((item) => {
      if (enrolledCourseIds.has(item.courseId)) return true;
      return !isCourseAvailable(item.course);
    })
    .map((item) => item.courseId);

  if (staleCourseIds.length > 0) {
    await repository.removeItems(dbCart.id, staleCourseIds);

    const removedEnrolled = staleCourseIds.filter((id) =>
      enrolledCourseIds.has(id),
    );
    const removedUnavailable = staleCourseIds.filter(
      (id) => !enrolledCourseIds.has(id),
    );

    if (removedEnrolled.length > 0) {
      warnings.push('تمت إزالة دورات سبق شراؤها من السلة');
    }
    if (removedUnavailable.length > 0) {
      warnings.push('تمت إزالة دورات غير متاحة من السلة');
    }
  }

  const refreshedCart = await repository.findByUserId(userId);
  if (!refreshedCart || refreshedCart.items.length === 0) {
    if (refreshedCart && (refreshedCart.couponId || staleCourseIds.length > 0)) {
      await repository.updateTotals(refreshedCart.id, {
        subtotal: 0,
        discount: 0,
        total: 0,
      });
      if (refreshedCart.couponId) {
        await repository.clearCoupon(refreshedCart.id);
      }
    }

    const empty = emptyCartDto(userId);
    return warnings.length > 0 ? { ...empty, warnings } : empty;
  }

  const subtotal = parseFloat(
    refreshedCart.items
      .reduce((acc, item) => acc + Number(item.price), 0)
      .toFixed(2),
  );

  let discount = 0;
  let coupon = refreshedCart.coupon;

  if (coupon) {
    if (isCouponValid(coupon, subtotal)) {
      discount = calculateDiscount(subtotal, coupon);
    } else {
      await repository.clearCoupon(refreshedCart.id);
      coupon = null;
      warnings.push('انتهت صلاحية كود الخصم وتمت إزالته');
    }
  }

  const total = parseFloat(Math.max(subtotal - discount, 0).toFixed(2));
  const storedSubtotal = Number(refreshedCart.subtotal);
  const storedDiscount = Number(refreshedCart.discount);
  const storedTotal = Number(refreshedCart.total);

  if (
    storedSubtotal !== subtotal ||
    storedDiscount !== discount ||
    storedTotal !== total
  ) {
    await repository.updateTotals(refreshedCart.id, {
      subtotal,
      discount,
      total,
    });
  }

  return mapCartToDto(refreshedCart, userId, {
    discount,
    coupon,
    warnings: warnings.length > 0 ? warnings : undefined,
  });
}

export async function getCartForUser(
  userId: string,
  repository: CartRepository = cartRepository,
): Promise<CartDataType> {
  const dbCart = await repository.findByUserId(userId);
  if (!dbCart) {
    return emptyCartDto(userId);
  }

  return reconcileCart(userId, dbCart, repository);
}

/** @deprecated Prefer addCartItemUseCase directly. Delegates to clean-architecture use case. */
export async function addCartItem(
  userId: string,
  courseId: string,
): Promise<CartDataType> {
  return addCartItemUseCase({ userId, courseId });
}

export async function removeCartItem(
  userId: string,
  courseId: string,
): Promise<CartDataType> {
  const cart = await cartRepository.findByUserId(userId);

  if (cart) {
    await cartRepository.removeItems(cart.id, [courseId]);
  }

  return getCartForUser(userId);
}

export async function clearCart(userId: string): Promise<CartDataType> {
  const cart = await cartRepository.findByUserId(userId);

  if (cart) {
    await cartRepository.clearItems(cart.id);
    // Reset stored financials explicitly: reconcile only rewrites totals when
    // it removed stale items itself or a coupon was attached.
    await cartRepository.updateTotals(cart.id, {
      subtotal: 0,
      discount: 0,
      total: 0,
    });
    if (cart.couponId) {
      await cartRepository.clearCoupon(cart.id);
    }
  }

  return getCartForUser(userId);
}
