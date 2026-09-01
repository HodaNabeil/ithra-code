'use client';

import { APP_ROUTES } from '@/constants/enums';
import { useGuestCart } from '@/features/cart/hooks/useGuestCart';
import { useCartStore } from '@/features/cart/stores/use-cart-store';
import { ShoppingCart } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useIsClient } from '@/hooks/use-is-client';
import { AUTH_SESSION_STATUS, isAuthenticatedStatus } from '@/constants/states';

interface ShoppingCartButtonClientProps {
  initialCount: number;
  isAuthenticated: boolean;
}

export function ShoppingCartButtonClient({
  initialCount,
  isAuthenticated,
}: ShoppingCartButtonClientProps) {
  const router = useRouter();
  const { status } = useSession();
  const isClient = useIsClient();
  const isAuthed = isClient
    ? isAuthenticatedStatus(status)
    : isAuthenticated;
  const prevStatusRef = useRef(status);

  const itemCount = useCartStore((state) => state.itemCount);
  const setItemCount = useCartStore((state) => state.setItemCount);

  const { guestIds, guestCartHydrated } = useGuestCart();

  useEffect(() => {
    if (isAuthed) {
      setItemCount(initialCount);
    }
  }, [initialCount, isAuthed, setItemCount]);

  useEffect(() => {
    if (
      prevStatusRef.current !== AUTH_SESSION_STATUS.AUTHENTICATED &&
      isAuthenticatedStatus(status)
    ) {
      router.refresh();
    }
    prevStatusRef.current = status;
  }, [status, router]);

  const count = isAuthed
    ? isClient
      ? itemCount
      : initialCount
    : guestCartHydrated
      ? guestIds.length
      : 0;

  return (
    <Link
      href={APP_ROUTES.CART}
      className="relative inline-flex text-primary"
      aria-label="السلة"
    >
      <ShoppingCart className="size-6" />
      {count > 0 && (
        <span className="absolute -top-1.5 -end-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 text-[10px] font-medium text-primary-foreground">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
