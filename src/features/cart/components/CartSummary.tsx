import { Button } from '@/components/ui/button';
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
      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">الإجمالي:</span>
        <span className="text-4xl sm:text-5xl font-bold text-foreground leading-none">
          {formatPrice(total, currency)}
        </span>

        {hasDiscount && (
          <div className="flex flex-col gap-0.5 items-start mt-1">
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(originalTotal, currency)}
            </span>
            <span className="text-sm text-primary font-medium">
              {discountPercent}% خصم
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <CheckoutButton />
        <p className="text-center text-xs text-muted-foreground leading-relaxed">
          لن يتم خصم أي مبلغ منك حتى الآن
        </p>
      </div>

      <div className="pt-6 border-t border-border">
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 rounded-lg border-primary text-primary hover:bg-primary/5 hover:text-primary hover:border-primary"
        >
          تطبيق القسيمة
        </Button>
      </div>
    </div>
  );
}
