'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ErrorRetry } from '@/components/shared/ErrorRetry';
import { Spinner } from '@/components/ui/spinner';
import { getCartAction } from '@/features/cart/actions/cart';
import { CartContainer } from '@/features/cart/components/cart-container';
import { GuestCartContainer } from '@/features/cart/components/guest-cart-container';
import {
  isAuthenticatedStatus,
  isAuthSessionLoading,
} from '@/constants/states/auth.states';
import type { CartDataType } from '@/types/cart/cart';

export default function CartPage() {
  const { status } = useSession();
  const [cart, setCart] = useState<CartDataType | undefined>();
  const [hasError, setHasError] = useState(false);
  const [fetchRequestId, setFetchRequestId] = useState(0);

  const isAuthed = isAuthenticatedStatus(status);

  useEffect(() => {
    if (!isAuthed) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const result = await getCartAction();

      if (cancelled) {
        return;
      }

      if (!result.success) {
        console.error('Failed to fetch cart:', result.error);
        setHasError(true);
        return;
      }

      setHasError(false);
      setCart(result.data);
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthed, fetchRequestId]);

  const retry = useCallback(() => {
    setCart(undefined);
    setHasError(false);
    setFetchRequestId((id) => id + 1);
  }, []);

  if (isAuthSessionLoading(status)) {
    return (
      <div className="flex justify-center py-20 pb-6">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="pb-6">
        <GuestCartContainer />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="pb-6">
        <ErrorRetry onRetry={retry} />
      </div>
    );
  }

  if (!cart) {
    return (
      <div className="flex justify-center py-20 pb-6">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="pb-6">
      <CartContainer cart={cart} />
    </div>
  );
}
