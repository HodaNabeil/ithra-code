'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { syncGuestCartAction } from '@/features/cart/actions/cart';
import { useGuestCart } from '@/features/cart/hooks/useGuestCart';

/**
 * Merges localStorage guest cart into the API cart after login/register.
 * Mounted globally — runs once when the session is authenticated and guest IDs exist.
 */
export function GuestCartSync() {
  const router = useRouter();
  const { status } = useSession();
  const isAuthed = status === 'authenticated';
  const { guestIds, guestCartHydrated, clearGuestCart } = useGuestCart();
  const syncingRef = useRef(false);

  useEffect(() => {
    if (!isAuthed || !guestCartHydrated || syncingRef.current) return;
    if (guestIds.length === 0) return;

    syncingRef.current = true;
    const idsToSync = [...guestIds];

    (async () => {
      try {
        await syncGuestCartAction(idsToSync);
        clearGuestCart();
        router.refresh();
      } catch (error) {
        console.error('[GUEST_CART_SYNC]', error);
      } finally {
        syncingRef.current = false;
      }
    })();
  }, [isAuthed, guestCartHydrated, guestIds, clearGuestCart, router]);

  return null;
}
