'use client';

import { APP_ROUTES } from '@/constant/enums';
import { useGuestCart } from '@/features/cart/hooks/useGuestCart';
import { useCartStore } from '@/features/cart/stores/use-cart-store';
import { ShoppingCart } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

interface ShoppingCartButtonClientProps {
  initialCount: number;
}

export function ShoppingCartButtonClient({
  initialCount,
}: ShoppingCartButtonClientProps) {
  const router = useRouter();
  const { status } = useSession();
  const isAuthed = status === 'authenticated';
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
      prevStatusRef.current !== 'authenticated' &&
      status === 'authenticated'
    ) {
      router.refresh();
    }
    prevStatusRef.current = status;
  }, [status, router]);

  const hasPendingGuestItems =
    isAuthed && guestCartHydrated && guestIds.length > 0;

  const count = isAuthed
    ? hasPendingGuestItems
      ? itemCount + guestIds.length
      : itemCount
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
