'use client';

import Link from 'next/link';
import { Lock, ShieldCheck } from 'lucide-react';
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
  'rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6';

export function CheckoutView({
  cart,
  paymobSession = null,
  paymobError = null,
}: CheckoutViewProps) {
  const itemCount = cart.items.length;
  const usePaymobEmbed = paymobSession != null;

  if (!usePaymobEmbed) {
    return (
      <div className="container px-4 pt-6 pb-10 lg:pt-8 lg:pb-14" dir="rtl">
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
    <div className="container px-4 pt-6 pb-10 lg:pt-8 lg:pb-14" dir="rtl">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <CheckoutPageHeader />

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18.75rem] lg:gap-8">
          <div className={CHECKOUT_CARD_CLASS}>
            <section
              aria-labelledby="order-details-heading"
              className="flex flex-col gap-4"
            >
              <h2
                id="order-details-heading"
                className="text-base font-semibold text-foreground"
              >
                تفاصيل الطلب ({itemCount} من الدورات)
              </h2>

              <CheckoutCourseList items={cart.items} currency={cart.currency} />
            </section>

            <Separator className="my-6" />

            <section
              aria-labelledby="card-payment-heading"
              className="flex flex-col gap-4"
            >
              <h2 id="card-payment-heading" className="sr-only">
                بيانات البطاقة
              </h2>

              <div className="flex items-center justify-end">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Lock className="size-3.5" />
                  دفع آمن ومشفّر
                </span>
              </div>

              <PaymobPixelCheckout
                key={`${paymobSession.clientSecret}-${paymobSession.orderId}`}
                session={paymobSession}
              />
            </section>
          </div>

          <aside aria-labelledby="order-summary-heading">
            <div className={cn(CHECKOUT_CARD_CLASS, 'flex flex-col gap-5')}>
              <h2
                id="order-summary-heading"
                className="text-base font-bold text-foreground"
              >
                ملخص الطلب
              </h2>

              <div className="flex flex-col gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">السعر الأصلي</span>
                  <span className="font-medium tabular-nums text-foreground">
                    {formatPrice(cart.subtotal, cart.currency)}
                  </span>
                </div>

                {cart.discount > 0 && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">الخصم</span>
                    <span className="font-medium tabular-nums text-primary">
                      −{formatCurrency(cart.discount, cart.currency)}
                    </span>
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-foreground">
                    الإجمالي ({itemCount} دورات)
                  </span>
                  <span className="text-lg font-bold tabular-nums text-foreground">
                    {formatPrice(cart.total, cart.currency)}
                  </span>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground">
                بإتمام عملية الشراء فإنك توافق على{' '}
                <Link
                  href={PUBLIC_ROUTES.TERMS}
                  className="underline underline-offset-2 transition-colors hover:text-foreground"
                >
                  شروط الاستخدام
                </Link>
                .
              </p>

              <Separator />

              <div className="flex flex-col gap-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ShieldCheck className="size-4 text-primary" />
                  ضمان استرداد الأموال لمدة 30 يومًا
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  هل أنت غير راضٍ؟ يمكنك استرداد المبلغ بالكامل خلال 30 يومًا.
                  بكل بساطة!
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function CheckoutPageHeader() {
  return (
    <header className="flex flex-col gap-1">
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">الدفع</h1>
      <p className="text-sm text-muted-foreground">
        راجع طلبك وأدخل بيانات البطاقة لإتمام الشراء.
      </p>
    </header>
  );
}
