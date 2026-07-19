'use client';

import { formatPrice } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { CartItemType } from '@/types/cart/cart';
import { CartCouponSection } from './cart-coupon-section';
import { CheckoutButton } from './checkout-button';

interface CartSummaryProps {
  total: number;
  originalTotal: number;
  discount: number;
  currency: string;
  items: CartItemType[];
  showTotal?: boolean;
  showCheckout?: boolean;
  showCoupon?: boolean;
  couponOpen?: boolean;
  onCouponToggle?: (open: boolean) => void;
  className?: string;
}

export function CartSummary({
  total,
  originalTotal,
  currency,
  showTotal = true,
  showCheckout = true,
  showCoupon = true,
  couponOpen,
  onCouponToggle,
  className,
}: CartSummaryProps) {
  const hasDiscount = originalTotal > total;
  const discountPercent = hasDiscount
    ? Math.round(((originalTotal - total) / originalTotal) * 100)
    : 0;

  return (
    <div
      className={cn(
        'flex flex-col gap-6 lg:sticky lg:top-24 text-right',
        showTotal && 'lg:mt-1.5',
        !showTotal && 'lg:pt-6',
        className,
      )}
      dir="rtl"
    >
      {showTotal && (
        <div className="flex flex-col gap-1">
          <span className="text-base font-medium text-muted-foreground">
            الإجمالي:
          </span>
          <span className="text-3xl sm:text-4xl font-bold text-foreground leading-none">
            {formatPrice(total, currency)}
          </span>

          {hasDiscount && (
            <div className="flex flex-col gap-0.5 items-start">
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(originalTotal, currency)}
              </span>
              <span className="text-sm text-primary font-medium">
                {discountPercent}% خصم
              </span>
            </div>
          )}

          {couponOpen && onCouponToggle && (
            <button
              type="button"
              onClick={() => onCouponToggle(false)}
              className="text-sm text-primary hover:underline w-fit mt-1"
            >
              إخفاء الرموز
            </button>
          )}
        </div>
      )}

      {showCheckout && (
        <div className="hidden lg:flex flex-col gap-4">
          <CheckoutButton />
          <p className="text-xs text-muted-foreground leading-relaxed">
            لن يتم خصم أي مبلغ منك حتى الآن
          </p>
        </div>
      )}

      {showCoupon && (
        <CartCouponSection isOpen={couponOpen} onOpenChange={onCouponToggle} />
      )}
    </div>
  );
}
