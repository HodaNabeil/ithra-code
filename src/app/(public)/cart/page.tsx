import { auth } from '@/lib/auth';
import CartContainer from '@/features/cart/components/CartContainer';
import { GuestCartContainer } from '@/features/cart/components/GuestCartContainer';

export default async function CartPage() {
  const session = await auth();
  const isAuthed = !!session?.user?.id;

  return (
    <div className="pb-6">
      {isAuthed ? <CartContainer /> : <GuestCartContainer />}
    </div>
  );
}
