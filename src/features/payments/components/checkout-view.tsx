'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { CHECKOUT_PROVIDERS } from '@/constants/payment';
import { PUBLIC_ROUTES } from '@/constants/routes';
import { createCheckoutAction } from '@/features/payments/actions/create-checkout.action';
import { CheckoutCourseList } from '@/features/payments/components/checkout-course-list';
import {
  PaymobPixelCheckout,
  type PaymobEmbedSession,
} from '@/features/payments/components/paymob-pixel-checkout';
import {
  getCheckoutProviderOptions,
  PaymentProviderSelector,
} from '@/features/payments/components/payment-provider-selector';
import { formatCurrency, formatPrice } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { CartDataType } from '@/types/cart/cart';

type CheckoutViewProps = {
  cart: CartDataType;
  isDevelopment: boolean;
  paymobSession?: PaymobEmbedSession | null;
  paymobError?: string | null;
};

const CHECKOUT_CARD_CLASS =
  'rounded-xl border border-border bg-card/40 p-5 sm:p-6';

export function CheckoutView({
  cart,
  isDevelopment,
  paymobSession = null,
  paymobError = null,
}: CheckoutViewProps) {
  const providerOptions = useMemo(
    () => getCheckoutProviderOptions(isDevelopment),
    [isDevelopment],
  );
  const [provider, setProvider] = useState(providerOptions[0]?.value ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isPaymobReady, setIsPaymobReady] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isPaymob = provider === CHECKOUT_PROVIDERS.PAYMOB;
  const usePaymobEmbed = isPaymob && paymobSession != null;
  const itemCount = cart.items.length;

  const handleProviderChange = (value: string) => {
    setProvider(value);
    setIsPaymobReady(false);
  };

  const handleFakePay = () => {
    setError(null);

    startTransition(async () => {
      const result = await createCheckoutAction(provider);

      if (!result.success) {
        setError(result.error);
        return;
      }

      window.location.assign(result.data.redirectUrl);
    });
  };

  const isPaymobLoading = isPaymob && usePaymobEmbed && !isPaymobReady;
  const isPaymobError = isPaymob && !usePaymobEmbed;

  if (isPaymobLoading) {
    return (
      <div
        className="container flex min-h-[60vh] flex-col items-center justify-center px-4 py-20"
        dir="rtl"
      >
        <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
          <Spinner className="size-6" />
          جاري تحميل نموذج الدفع…
        </div>

        <div className="sr-only" aria-hidden>
          <PaymobPixelCheckout
            key={paymobSession.clientSecret}
            session={paymobSession}
            onReady={() => setIsPaymobReady(true)}
          />
        </div>
      </div>
    );
  }

  if (isPaymobError) {
    return (
      <div className="container px-4 pt-6 pb-10 lg:pt-8 lg:pb-14" dir="rtl">
        <div className="mx-auto flex max-w-5xl flex-col gap-5">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            الدفع
          </h1>

          <div className={CHECKOUT_CARD_CLASS}>
            <PaymentProviderSelector
              options={providerOptions}
              value={provider}
              onChange={handleProviderChange}
              disabled={isPending}
            />

            <Alert variant="destructive" role="alert" className="mt-5">
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
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-6 lg:flex-row lg:gap-8">
        {/* Main: method + order details + Paymob embed / fake pay */}
        <div className="flex w-full min-w-0 flex-1 flex-col gap-5">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            الدفع
          </h1>

          <div className={CHECKOUT_CARD_CLASS}>
            <PaymentProviderSelector
              options={providerOptions}
              value={provider}
              onChange={handleProviderChange}
              disabled={isPending}
            />

            {isPaymob && usePaymobEmbed ? (
              <>
                <section
                  aria-labelledby="order-details-heading"
                  className="mt-5 border-t border-border pt-5"
                >
                  <h2
                    id="order-details-heading"
                    className="mb-4 text-sm font-semibold text-foreground"
                  >
                    تفاصيل الطلب ({itemCount} من الدورات)
                  </h2>

                  <CheckoutCourseList
                    items={cart.items}
                    currency={cart.currency}
                  />
                </section>

                <section
                  aria-labelledby="card-payment-heading"
                  className="mt-5 flex flex-col gap-4 border-t border-border pt-5"
                >
                  <h2 id="card-payment-heading" className="sr-only">
                    بيانات البطاقة
                  </h2>

                  <PaymobPixelCheckout
                    key={paymobSession.clientSecret}
                    session={paymobSession}
                    onReady={() => setIsPaymobReady(true)}
                  />
                </section>
              </>
            ) : (
              <>
                <section
                  aria-labelledby="order-details-heading"
                  className="mt-5 border-t border-border pt-5"
                >
                  <h2
                    id="order-details-heading"
                    className="mb-4 text-sm font-semibold text-foreground"
                  >
                    تفاصيل الطلب ({itemCount} من الدورات)
                  </h2>

                  <CheckoutCourseList
                    items={cart.items}
                    currency={cart.currency}
                  />
                </section>

                <section
                  aria-labelledby="card-payment-heading"
                  className="mt-5 flex flex-col gap-4 border-t border-border pt-5"
                >
                  <h2 id="card-payment-heading" className="sr-only">
                    دفع تجريبي
                  </h2>

                  <div className="rounded-lg border border-border bg-background/40 p-4">
                    <p className="mb-1 text-sm font-semibold text-foreground">
                      دفع تجريبي
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      وضع التطوير: سيتم محاكاة الدفع بدون بوابة حقيقية.
                    </p>
                  </div>

                  {error && (
                    <Alert variant="destructive" role="alert">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="button"
                    size="lg"
                    className="h-12 w-full rounded-lg bg-muted text-base font-semibold text-foreground hover:bg-muted/80"
                    disabled={isPending || !provider}
                    onClick={handleFakePay}
                    aria-busy={isPending}
                  >
                    {isPending ? (
                      <>
                        <Spinner className="size-4" />
                        جاري التحويل…
                      </>
                    ) : (
                      <>Pay {formatPayLabel(cart.total, cart.currency)}</>
                    )}
                  </Button>
                </section>
              </>
            )}
          </div>
        </div>

        {/* Sidebar: order summary + terms + guarantee */}
        <aside
          className="w-full shrink-0 lg:sticky lg:top-24 lg:w-75"
          aria-labelledby="order-summary-heading"
        >
          <div className={cn(CHECKOUT_CARD_CLASS, 'flex flex-col gap-5')}>
            <div className="flex flex-col gap-3 text-sm" dir="rtl">
              <h2
                id="order-summary-heading"
                className="text-base font-bold text-foreground"
              >
                ملخص الطلب
              </h2>

              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">السعر الأصلي:</span>
                <span className="font-medium tabular-nums text-foreground">
                  {formatPrice(cart.subtotal, cart.currency)}
                </span>
              </div>

              {cart.discount > 0 && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">الخصم:</span>
                  <span className="font-medium tabular-nums text-primary">
                    −{formatCurrency(cart.discount, cart.currency)}
                  </span>
                </div>
              )}

              <p className="pt-1 text-sm font-bold text-foreground">
                الإجمالي ({itemCount} من الدورات):{' '}
                <span className="tabular-nums">
                  {formatPrice(cart.total, cart.currency)}
                </span>
              </p>
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              بإتمام عملية الشراء فإنك توافق على{' '}
              <Link
                href={PUBLIC_ROUTES.TERMS}
                className="underline underline-offset-2 hover:text-foreground"
              >
                شروط الاستخدام
              </Link>
              .
            </p>

            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <h3 className="text-sm font-bold text-foreground">
                ضمان استرداد الأموال لمدة 30 يومًا
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                هل أنت غير راضٍ؟ يمكنك استرداد المبلغ بالكامل خلال 30 يومًا. بكل
                بساطة!
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/** Pay button label in the style of the Paymob CTA (e.g. "EGP 1557.8"). */
function formatPayLabel(amount: number, currency: string): string {
  const code = currency.toUpperCase();
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${code} ${formatted}`;
}
