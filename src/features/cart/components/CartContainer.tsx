import { auth } from '@/lib/auth';
import { resolveCartPageState } from '../lib/cart-page-state';
import { CartEmptyState } from './CartEmptyState';
import { CartErrorState } from './CartErrorState';
import { CartFilledView } from './CartFilledView';
import { GuestCartContainer } from './GuestCartContainer';

export default async function CartContainer() {
  const session = await auth();

  if (!session?.user?.id) {
    return <GuestCartContainer />;
  }

  const state = await resolveCartPageState();

  switch (state.kind) {
    case 'failure':
      return <CartErrorState />;
    case 'empty':
      return <CartEmptyState />;
    case 'ready':
      return <CartFilledView cartData={state.data} />;
  }
}
