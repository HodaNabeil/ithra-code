import { cn } from '@/lib/utils';
import type { CartDataType } from '@/types/cart/cart';
import { CartHero } from './cart-hero';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';

type CartFilledViewProps = {
  cartData: CartDataType;
};

export function CartFilledView({ cartData }: CartFilledViewProps) {
  const cartItems = cartData.items;

  return (
    <>
      <CartHero />
      <div
        className={cn(
          'flex flex-col-reverse lg:flex-row gap-6 lg:gap-12 container px-4 pb-32 lg:pb-0',
        )}
        dir="rtl"
      >
        <div className={cn('flex-1 space-y-2')}>
          <p className={cn('text-base mb-2')}>
            يوجد {cartItems.length} من الدورات في السلة
          </p>
          <div
            className={cn(
              'border-t border-border flex flex-col gap-4 sm:flex-none sm:gap-0',
            )}
          >
            {cartItems.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                isGuestCart={cartData.id === 'guest'}
              />
            ))}
          </div>
        </div>

        <div className={cn('w-full lg:w-[400px]')}>
          <CartSummary
            total={cartData.total}
            originalTotal={cartData.subtotal}
            discount={cartData.discount}
            currency={cartData.currency}
            items={cartItems}
          />
        </div>
      </div>
    </>
  );
}
