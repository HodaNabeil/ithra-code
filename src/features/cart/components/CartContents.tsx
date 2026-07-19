import { cn } from '@/lib/utils';
import type { CartDataType } from '@/types/cart/cart';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';

type CartContentsProps = {
  cart: CartDataType;
};

export function CartContents({ cart }: CartContentsProps) {
  const cartItems = cart.items;

  return (
    <div
      className={cn(
        'flex flex-col-reverse lg:flex-row gap-6 lg:gap-12 container px-4 pb-32 lg:pb-0',
      )}
      dir="rtl"
    >
      <div className={cn('flex-1')}>
        <div
          className={cn(
            'border-t border-border flex flex-col gap-4 sm:flex-none sm:gap-0',
          )}
        >
          {cartItems.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              isGuestCart={cart.id === 'guest'}
            />
          ))}
        </div>
      </div>

      <div className={cn('w-full lg:w-[400px]')}>
        <CartSummary
          total={cart.total}
          originalTotal={cart.subtotal}
          discount={cart.discount}
          currency={cart.currency}
          items={cartItems}
        />
      </div>
    </div>
  );
}
