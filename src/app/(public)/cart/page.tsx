import { Suspense } from 'react';
import CartContainer from '@/features/cart/components/CartContainer';
import { CartSkeleton } from '@/features/cart/components/CartSkeleton/CartSkeleton';
import { GuestCartSync } from '@/features/cart/components/GuestCartSync';

export default async function CartPage() {
  return (
    <div className="pb-6">
      <GuestCartSync />
      <Suspense fallback={<CartSkeleton />}>
        <CartContainer />
      </Suspense>
    </div>
  );
}
