'use client';

import { useGuestCart } from '../hooks/useGuestCart';
import { CartEmptyState } from './CartEmptyState';
import { CartWithItemsView } from './CartWithItemsView';
import { CartHero } from './cart-hero';

/**
 * Client-side cart view for unauthenticated users (localStorage source of truth).
 */
export function GuestCartContainer() {
  const { guestCartHydrated, buildGuestCart } = useGuestCart();

  if (!guestCartHydrated) {
    return null;
  }

  const guestCart = buildGuestCart();

  if (!guestCart || guestCart.items.length === 0) {
    return (
      <>
        <CartHero />
        <CartEmptyState />
      </>
    );
  }

  return <CartWithItemsView cartData={guestCart} />;
}
