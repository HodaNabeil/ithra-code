import { formatPrice } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { CartItemType } from '@/types/cart/cart';
import { CheckoutButton } from './CheckoutButton';

interface CartSummaryProps {
  total: number;
  originalTotal: number;
  discount: number;
  currency: string;
  items: CartItemType[];
}

export function CartSummary({
  total,
  originalTotal,
  currency,
}: CartSummaryProps) {
  const hasDiscount = originalTotal > total;
  const discountPercent = hasDiscount
    ? Math.round(((originalTotal - total) / originalTotal) * 100)
    : 0;

  return (
    <div
      className={cn(
        'pt-8 lg:pt-0 flex flex-col gap-6 lg:sticky lg:top-24 text-right',
      )}
      dir="rtl"
    >
      <div className="space-y-4">
        <div
          className={cn(
            'mb-2 flex lg:flex-col gap-2 lg:gap-1 flex-wrap sm:flex-nowrap',
          )}
        >
          <span className="text-sm text-muted-foreground font-normal">
            الإجمالي:
          </span>
          <div
            className={cn(
              'flex flex-row lg:flex-col gap-2 lg:gap-1 items-start text-right',
            )}
          >
            <span className="text-4xl sm:text-5xl font-bold text-foreground leading-none">
              {formatPrice(total, currency)}
            </span>

            {hasDiscount && (
              <div
                className={cn(
                  'flex flex-row lg:flex-col gap-2 lg:gap-0 items-start mt-0.5',
                )}
              >
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(originalTotal, currency)}
                </span>
                <span className="text-sm text-primary font-medium">
                  {discountPercent}% خصم
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <CheckoutButton />
          <p className="text-center text-xs text-muted-foreground leading-relaxed">
            لن يتم خصم أي مبلغ منك حتى الآن
          </p>
        </div>
      </div>

      <div className={cn('pt-6 border-t border-border')}>
        <button
          type="button"
          className={cn(
            'w-full h-10 rounded-lg border border-dashed border-border bg-transparent',
            'text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors',
          )}
        >
          تطبيق الكوبون
        </button>
      </div>
    </div>
  );
}
