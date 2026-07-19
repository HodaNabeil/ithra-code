'use client';

import { CheckoutButton } from './checkout-button';

export function CartStickyCheckout() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border px-4 py-4 block lg:hidden shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      <div className="flex flex-col gap-2">
        <CheckoutButton />
        <p className="text-xs text-center text-muted-foreground leading-relaxed">
          لن يتم خصم أي مبلغ منك حتى الآن
        </p>
      </div>
    </div>
  );
}
