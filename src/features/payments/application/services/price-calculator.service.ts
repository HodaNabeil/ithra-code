import type { Currency } from '@/generated/prisma/enums';
import {
  calculateDiscount,
  isCouponValid,
} from '@/features/cart/mappers/cart.mapper';
import type { DB_CartCoupon } from '@/features/cart/infrastructure/prisma/cart.select';
import type { CheckoutCartSnapshot } from '../validators/checkout.validator';

export type PriceLineItem = {
  courseId: string;
  priceCents: number;
  currency: Currency;
};

export type PriceCalculationResult = {
  currency: Currency;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  items: PriceLineItem[];
  couponId: string | null;
  couponCode: string | null;
};

/** Converts a decimal major-unit amount to integer cents. */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Calculates authoritative checkout totals from server-side course prices.
 * The client is never trusted for pricing.
 */
export class PriceCalculatorService {
  calculate(cart: CheckoutCartSnapshot): PriceCalculationResult {
    const currency = cart.items[0]!.currency;

    const items: PriceLineItem[] = cart.items.map((item) => {
      const authoritativePrice = Number(item.course!.price);

      return {
        courseId: item.courseId,
        priceCents: toCents(authoritativePrice),
        currency,
      };
    });

    const subtotalCents = items.reduce(
      (total, item) => total + item.priceCents,
      0,
    );

    const subtotalMajor = subtotalCents / 100;
    const discountCents = this.calculateDiscountCents(
      cart.coupon,
      subtotalMajor,
    );
    const taxCents = 0;
    const totalCents = Math.max(subtotalCents - discountCents + taxCents, 0);

    return {
      currency,
      subtotalCents,
      discountCents,
      taxCents,
      totalCents,
      items,
      couponId: cart.coupon?.id ?? null,
      couponCode: cart.coupon?.code ?? null,
    };
  }

  private calculateDiscountCents(
    coupon: DB_CartCoupon | null,
    subtotalMajor: number,
  ): number {
    if (!coupon || !isCouponValid(coupon, subtotalMajor)) {
      return 0;
    }

    return toCents(calculateDiscount(subtotalMajor, coupon));
  }
}
