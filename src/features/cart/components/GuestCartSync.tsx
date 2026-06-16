'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { cookieManager } from '@/lib/cookie-manager';
import { syncGuestCartAction } from '@/features/cart/actions/cart';
import { useGuestCart } from '@/features/cart/hooks/useGuestCart';

/**
 * Merges localStorage guest cart into the API cart after login.
 * Mounted on the cart page — runs once when authed + guest IDs exist.
 */
export function GuestCartSync() {
  const router = useRouter();
  const { guestIds, guestCartHydrated, clearGuestCart } = useGuestCart();
  const syncingRef = useRef(false);

  useEffect(() => {
    if (!guestCartHydrated || syncingRef.current) return;
    if (!cookieManager.getAccessToken()) return;
    if (guestIds.length === 0) return;

    syncingRef.current = true;

    (async () => {
      try {
        await syncGuestCartAction(guestIds);
        clearGuestCart();
        router.refresh();
      } catch (error) {
        console.error('[GUEST_CART_SYNC]', error);
      } finally {
        syncingRef.current = false;
      }
    })();
  }, [guestCartHydrated, guestIds, clearGuestCart, router]);

  return null;
}
