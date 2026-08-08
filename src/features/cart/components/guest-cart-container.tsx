'use client';

import { emptyCartDto } from '../mappers/cart.mapper';
import { useGuestCart } from '../hooks/useGuestCart';
import { CartContainer } from './cart-container';

/**
 * Client-side cart view for unauthenticated users (localStorage source of truth).
 */
export function GuestCartContainer() {
  const { guestCartHydrated, buildGuestCart } = useGuestCart();

  if (!guestCartHydrated) {
    return null;
  }

  const cart = buildGuestCart() ?? emptyCartDto('');

  return <CartContainer cart={cart} />;
}
