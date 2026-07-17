import { resolveCartPageState } from '../lib/cart-page-state';
import { CartEmptyState } from './CartEmptyState';
import { CartErrorState } from './CartErrorState';
import { CartWithItemsView } from './CartWithItemsView';
import { CartHero } from './cart-hero';

export default async function CartContainer() {
  const state = await resolveCartPageState();

  if (state.kind === 'failure') {
    return <CartErrorState />;
  }

  if (state.kind === 'empty') {
    return (
      <>
        <CartHero />
        <CartEmptyState />
      </>
    );
  }

  return <CartWithItemsView cartData={state.data} />;
}
