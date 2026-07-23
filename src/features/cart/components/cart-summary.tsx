'use client';

import { formatPrice } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { CartItemType } from '@/types/cart/cart';
import { PricingBreakdown } from '@/features/payments/components/pricing-breakdown';
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
  showBreakdown?: boolean;
  couponOpen?: boolean;
  onCouponToggle?: (open: boolean) => void;
  className?: string;
}

export function CartSummary({
  total,
  originalTotal,
  discount,
  currency,
  showTotal = true,
  showCheckout = true,
  showCoupon = true,
  showBreakdown,
  couponOpen,
  onCouponToggle,
  className,
}: CartSummaryProps) {
  const shouldShowBreakdown = showBreakdown ?? showTotal;
  const hasDiscount = discount > 0 || originalTotal > total;

  return (
    <div
      className={cn(
        'flex flex-col gap-4 lg:sticky lg:top-24 text-right',
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

          {hasDiscount && originalTotal > total && (
            <div className="flex flex-col gap-0.5 items-start">
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(originalTotal, currency)}
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

      {shouldShowBreakdown && (
        <PricingBreakdown
          subtotal={originalTotal}
          discount={discount}
          tax={0}
          total={total}
          currency={currency}
        />
      )}

      {showCheckout && (
        <div className="hidden lg:flex flex-col gap-3">
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
