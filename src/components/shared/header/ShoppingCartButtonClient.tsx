'use client';

import { APP_ROUTES } from '@/constants/enums';
import { useGuestCart } from '@/features/cart/hooks/useGuestCart';
import { useCartStore } from '@/features/cart/stores/use-cart-store';
import { ShoppingCart } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import {
  AUTH_SESSION_STATUS,
  isAuthenticatedStatus,
} from '@/constants/states';

interface ShoppingCartButtonClientProps {
  initialCount: number;
}

export function ShoppingCartButtonClient({
  initialCount,
}: ShoppingCartButtonClientProps) {
  const router = useRouter();
  const { status } = useSession();
  const isAuthed = isAuthenticatedStatus(status);
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
    ? itemCount
    : guestCartHydrated
      ? guestIds.length
      : 0;

  return (
    <Link href={APP_ROUTES.CART} className="relative" aria-label="السلة">
      <ShoppingCart />
      {count > 0 && (
        <p
          className="absolute top-[-10px] right-[-10px] bg-primary text-primary-foreground
       rounded-full min-w-4 h-4 px-0.5 flex items-center justify-center text-[10px]"
        >
          {count > 99 ? '99+' : count}
        </p>
      )}
    </Link>
  );
}
