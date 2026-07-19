'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { CartDataType } from '@/types/cart/cart';
import { CartHero } from './cart-hero';
import { CartItem } from './cart-item';
import { CartStickyCheckout } from './cart-sticky-checkout';
import { CartSummary } from './cart-summary';

type CartContentsProps = {
  cart: CartDataType;
};

const summaryProps = (cart: CartDataType) => ({
  total: cart.total,
  originalTotal: cart.subtotal,
  discount: cart.discount,
  currency: cart.currency,
  items: cart.items,
});

export function CartContents({ cart }: CartContentsProps) {
  const [couponOpen, setCouponOpen] = useState(false);
  const cartItems = cart.items;
  const itemCount = cartItems.length;

  return (
    <>
      <div className="container px-4 mt-8" dir="rtl">
        <div className="lg:flex lg:items-end lg:gap-12">
          <CartHero itemCount={itemCount} className="flex-1 min-w-0" />

          <div className="hidden lg:block w-full lg:w-[400px] shrink-0">
            <CartSummary
              {...summaryProps(cart)}
              showCheckout={false}
              showCoupon={false}
              couponOpen={couponOpen}
              onCouponToggle={setCouponOpen}
            />
          </div>
        </div>

        <div className="lg:hidden mt-6">
          <CartSummary
            {...summaryProps(cart)}
            showCheckout={false}
            couponOpen={couponOpen}
            onCouponToggle={setCouponOpen}
          />
        </div>

        <div
          className={cn(
            'flex flex-col lg:flex-row gap-6 lg:gap-12 pb-32 lg:pb-0',
            'mt-2.5 lg:mt-1.5',
          )}
        >
          <div className="flex-1 min-w-0 lg:border-t lg:border-border lg:pt-6">
            <p className="lg:hidden text-base text-foreground font-medium pb-4 mb-4 border-b border-border">
              يوجد {itemCount} من الدورات في السلة
            </p>

            <div className="flex flex-col divide-y divide-border">
              {cartItems.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  isGuestCart={cart.id === 'guest'}
                />
              ))}
            </div>
          </div>

          <div className="hidden lg:block w-full lg:w-[400px] shrink-0">
            <CartSummary
              {...summaryProps(cart)}
              showTotal={false}
              couponOpen={couponOpen}
              onCouponToggle={setCouponOpen}
            />
          </div>
        </div>
      </div>

      <CartStickyCheckout />
    </>
  );
}
