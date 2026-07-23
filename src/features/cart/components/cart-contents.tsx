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
      <div className="container px-4 mt-4 lg:mt-6 pb-6" dir="rtl">
        <CartHero itemCount={itemCount} />

        <div
          className={cn(
            'flex flex-col lg:flex-row gap-8 lg:gap-12 mt-6 lg:mt-8',
            'pb-28 lg:pb-0',
          )}
        >
          <div className="flex-1 min-w-0">
            <p className="lg:hidden text-base text-foreground font-medium pb-4 mb-4 border-b border-border">
              يوجد {itemCount} من الدورات في السلة
            </p>

            <div className="flex flex-col divide-y divide-border lg:border-t lg:border-border lg:pt-2">
              {cartItems.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  isGuestCart={cart.id === 'guest'}
                />
              ))}
            </div>
          </div>

          <div className="w-full lg:w-100 shrink-0">
            <CartSummary
              {...summaryProps(cart)}
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
