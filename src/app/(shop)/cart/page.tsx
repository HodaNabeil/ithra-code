import { ErrorRetry } from '@/components/shared/ErrorRetry';
import { CartContainer } from '@/features/cart/components/cart-container';
import { GuestCartContainer } from '@/features/cart/components/guest-cart-container';
import { getCart } from '@/features/cart/services/getCartItems';
import { auth } from '@/lib/auth';
import type { CartDataType } from '@/types/cart/cart';

export default async function CartPage() {
  const session = await auth();
  const isAuthed = !!session?.user?.id;

  if (!isAuthed) {
    return (
      <main className="pb-6">
        <GuestCartContainer />
      </main>
    );
  }

  let cart: CartDataType | undefined;
  let hasError = false;

  try {
    const response = await getCart();
    cart = response.data;
  } catch (error) {
    console.error('Failed to fetch cart:', error);
    hasError = true;
  }

  return (
    <main className="pb-6">
      {!hasError && cart && <CartContainer cart={cart} />}
      {hasError && <ErrorRetry />}
    </main>
  );
}
