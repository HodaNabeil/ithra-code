import { formatCurrency, formatPrice } from '@/lib/formatters';
import { cn } from '@/lib/utils';

export type PricingBreakdownProps = {
  subtotal: number;
  discount: number;
  /** Backend tax is not exposed on cart yet — always display 0. */
  tax?: number;
  total: number;
  currency: string;
  className?: string;
};

/**
 * Renders backend pricing fields only. Never recalculates totals on the client.
 */
export function PricingBreakdown({
  subtotal,
  discount,
  tax = 0,
  total,
  currency,
  className,
}: PricingBreakdownProps) {
  const formatLine = (amount: number) =>
    amount === 0
      ? formatCurrency(0, currency)
      : formatPrice(amount, currency);

  return (
    <dl
      className={cn('flex flex-col gap-2 text-sm text-right', className)}
      dir="rtl"
    >
      <div className="flex items-center justify-between gap-4">
        <dt className="text-muted-foreground">المجموع الفرعي</dt>
        <dd className="font-medium text-foreground tabular-nums">
          {formatLine(subtotal)}
        </dd>
      </div>

      <div className="flex items-center justify-between gap-4">
        <dt className="text-muted-foreground">الخصم</dt>
        <dd
          className={cn(
            'font-medium tabular-nums',
            discount > 0 ? 'text-primary' : 'text-foreground',
          )}
        >
          {discount > 0 ? `−${formatLine(discount)}` : formatLine(0)}
        </dd>
      </div>

      <div className="flex items-center justify-between gap-4">
        <dt className="text-muted-foreground">الضرائب</dt>
        <dd className="font-medium text-foreground tabular-nums">
          {formatLine(tax)}
        </dd>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-border pt-3 mt-1">
        <dt className="text-base font-semibold text-foreground">الإجمالي</dt>
        <dd className="text-base font-bold text-foreground tabular-nums">
          {formatPrice(total, currency)}
        </dd>
      </div>
    </dl>
  );
}
