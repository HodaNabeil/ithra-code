'use client';

import Link from 'next/link';
import { CreditCard } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { PUBLIC_ROUTES } from '@/constants/routes';
import { CheckoutCourseList } from '@/features/payments/components/checkout-course-list';
import {
  PaymobPixelCheckout,
  type PaymobEmbedSession,
} from '@/features/payments/components/paymob-pixel-checkout';
import { formatCurrency, formatPrice } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { CartDataType } from '@/types/cart/cart';

type CheckoutViewProps = {
  cart: CartDataType;
  paymobSession?: PaymobEmbedSession | null;
  paymobError?: string | null;
};

const CHECKOUT_CARD_CLASS =
  'rounded-2xl border border-border dark:border-gray-alpha-200 bg-card p-5 sm:p-6 md:p-7';

const ORDER_SUMMARY_CARD_CLASS =
  'rounded-2xl border border-border dark:border-gray-alpha-200 bg-card p-6 sm:p-7 md:p-8';

export function CheckoutView({
  cart,
  paymobSession = null,
  paymobError = null,
}: CheckoutViewProps) {
  const itemCount = cart.items.length;
  const usePaymobEmbed = paymobSession != null;

  if (!usePaymobEmbed) {
    return (
      <div className="container px-4 pt-6 pb-12 sm:pt-8 sm:pb-16" dir="rtl">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <CheckoutPageHeader />

          <div className={CHECKOUT_CARD_CLASS}>
            <Alert variant="destructive" role="alert">
              <AlertDescription>
                {paymobError ??
                  'نموذج Paymob غير متاح. تأكد من إعداد مفاتيح Paymob في البيئة.'}
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 pt-6 pb-12 sm:pt-8 sm:pb-16" dir="rtl">
      <div className="mx-auto flex max-w-5xl flex-col gap-5 sm:gap-6">
        <CheckoutPageHeader />

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-7 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className={cn(CHECKOUT_CARD_CLASS, 'flex flex-col gap-6')}>
            <PaymentMethodPill />

            <section
              aria-labelledby="order-details-heading"
              className="flex flex-col gap-4"
            >
              <h2
                id="order-details-heading"
                className="text-[0.9375rem] font-semibold tracking-tight text-foreground sm:text-base"
              >
                تفاصيل الطلب ({itemCount} من الدورات)
              </h2>

              <CheckoutCourseList items={cart.items} currency={cart.currency} />
            </section>

            <section
              aria-labelledby="card-payment-heading"
              className="flex flex-col gap-3"
            >
              <h2 id="card-payment-heading" className="sr-only">
                بيانات البطاقة
              </h2>

              <PaymobPixelCheckout
                key={`${paymobSession.clientSecret}-${paymobSession.orderId}`}
                session={paymobSession}
              />
            </section>
          </div>

          <aside
            aria-labelledby="order-summary-heading"
            className="lg:sticky lg:top-24"
          >
            <OrderSummaryCard cart={cart} itemCount={itemCount} />
          </aside>
        </div>
      </div>
    </div>
  );
}

function OrderSummaryCard({
  cart,
  itemCount,
}: {
  cart: CartDataType;
  itemCount: number;
}) {
  return (
    <div className={cn(ORDER_SUMMARY_CARD_CLASS, 'flex flex-col gap-6')}>
      <h2
        id="order-summary-heading"
        className="text-xl font-bold text-foreground"
      >
        ملخص الطلب
      </h2>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 text-sm sm:text-[0.9375rem]">
          <div
            className="flex items-center justify-between gap-4 border-b 
          border-border pb-4"
          >
            <span className="text-foreground">السعر الأصلي:</span>
            <span className="font-medium tabular-nums text-foreground">
              {formatPrice(cart.subtotal, cart.currency)}
            </span>
          </div>

          {cart.discount > 0 && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">الخصم:</span>
              <span className="font-medium tabular-nums text-foreground">
                −{formatCurrency(cart.discount, cart.currency)}
              </span>
            </div>
          )}
        </div>

        <Separator className="bg-border dark:bg-gray-alpha-200" />

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 text-base font-bold text-foreground">
            <span className="text-base font-bold text-foreground">
              الإجمالي ({itemCount} من الدورات):
            </span>
            <span className="shrink-0 tabular-nums">
              {formatPrice(cart.total, cart.currency)}
            </span>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground sm:text-[0.8125rem]">
            بإكمال عملية الشراء، فإنك توافق على{' '}
            <Link
              href={PUBLIC_ROUTES.TERMS}
              className="font-medium text-foreground transition-opacity hover:opacity-80"
            >
              شروط الاستخدام
            </Link>{' '}
            هذه.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <h3 className="text-sm font-bold leading-snug text-foreground sm:text-[0.9375rem]">
          ضمان استرداد الأموال لمدة 30 يومًا
        </h3>
        <p className="text-xs leading-relaxed text-muted-foreground sm:text-[0.8125rem]">
          هل أنت غير راضٍ؟ يمكنك استرداد المبلغ بالكامل خلال 30 يومًا. بكل
          بساطة!
        </p>
      </div>
    </div>
  );
}

function PaymentMethodPill() {
  return (
    <div className="flex justify-start">
      <div
        role="group"
        aria-label="طريقة الدفع"
        className="inline-flex items-center gap-2 rounded-lg border border-foreground/80 bg-transparent px-3.5 py-2 text-sm font-medium text-foreground"
      >
        <CreditCard className="size-4 shrink-0" aria-hidden />
        <span>بطاقة</span>
      </div>
    </div>
  );
}

function CheckoutPageHeader() {
  return (
    <header className="flex flex-col gap-1">
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">
        الدفع
      </h1>
      <p className="text-sm text-muted-foreground">
        راجع طلبك وأدخل بيانات البطاقة لإتمام الشراء.
      </p>
    </header>
  );
}
