import CartContainer from '@/features/cart/components/CartContainer';
import { GuestCartSync } from '@/features/cart/components/GuestCartSync';

export default async function CartPage() {
  return (
    <div className="pb-6">
      <GuestCartSync />
      <CartContainer />
    </div>
  );
}
