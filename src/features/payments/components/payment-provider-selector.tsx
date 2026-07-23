'use client';

import { CHECKOUT_PROVIDERS } from '@/constants/payment';
import { cn } from '@/lib/utils';
import { CreditCard, FlaskConical } from 'lucide-react';

export type CheckoutProviderOption = {
  /** Value sent to POST /api/payment/checkout */
  value: string;
  label: string;
  icon: 'paymob' | 'fake';
};

type PaymentProviderSelectorProps = {
  options: CheckoutProviderOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

const ICONS = {
  paymob: CreditCard,
  fake: FlaskConical,
} as const;

export function getCheckoutProviderOptions(
  isDevelopment: boolean,
): CheckoutProviderOption[] {
  const options: CheckoutProviderOption[] = [
    {
      value: CHECKOUT_PROVIDERS.PAYMOB,
      label: 'بطاقة',
      icon: 'paymob',
    },
  ];

  if (isDevelopment) {
    options.push({
      value: CHECKOUT_PROVIDERS.FAKE,
      label: 'Fake',
      icon: 'fake',
    });
  }

  return options;
}

/** Horizontal tabs matching the SAC/Udemy checkout payment method switcher. */
export function PaymentProviderSelector({
  options,
  value,
  onChange,
  disabled = false,
}: PaymentProviderSelectorProps) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="radiogroup"
      aria-label="اختر طريقة الدفع"
      dir="rtl"
    >
      {options.map((option) => {
        const selected = value === option.value;
        const Icon = ICONS[option.icon];

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected
                ? 'border-foreground/60 bg-transparent text-foreground'
                : 'border-border/80 text-muted-foreground hover:border-foreground/30 hover:text-foreground',
              disabled && 'cursor-not-allowed opacity-60',
            )}
          >
            <Icon className="size-4" aria-hidden />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
