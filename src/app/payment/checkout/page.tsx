import { redirect } from 'next/navigation';
import { APP_ROUTES } from '@/constants/enums';
import { env } from '@/config/env';
import { getCart } from '@/features/cart/services/getCartItems';
import { requireAuth } from '@/features/my-courses/lib/require-auth';
import { PaymentProvider } from '@/features/payments/domain';
import { CheckoutView } from '@/features/payments/components/checkout-view';
import type { PaymobEmbedSession } from '@/features/payments/components/paymob-pixel-checkout';
import { createCheckoutUseCase } from '@/features/payments/infrastructure/di/payments.container';
import { isPaymobConfigured } from '@/features/payments/infrastructure/gateways/paymob/paymob.config';

export default async function CheckoutPage() {
  const userId = await requireAuth(APP_ROUTES.CHECKOUT);

  const response = await getCart();
  const cart = response.data;

  if (!cart.items.length) {
    redirect(APP_ROUTES.CART);
  }

  let paymobSession: PaymobEmbedSession | null = null;
  let paymobError: string | null = null;

  if (isPaymobConfigured()) {
    const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');

    try {
      const result = await createCheckoutUseCase().execute({
        userId,
        provider: PaymentProvider.PAYMOB,
        successUrl: `${baseUrl}${APP_ROUTES.PAYMENT_SUCCESS}`,
        cancelUrl: `${baseUrl}${APP_ROUTES.PAYMENT_CANCEL}`,
      });

      if (result.clientSecret && result.publicKey) {
        paymobSession = {
          clientSecret: result.clientSecret,
          publicKey: result.publicKey,
          orderId: result.checkoutSession.orderId,
        };
      } else {
        paymobError = 'تعذر تهيئة نموذج الدفع المدمج';
      }
    } catch {
      paymobError = 'تعذر بدء عملية الدفع. حاول مرة أخرى.';
    }
  }

  return (
    <main>
      <CheckoutView
        cart={cart}
        isDevelopment={env.NODE_ENV === 'development'}
        paymobSession={paymobSession}
        paymobError={paymobError}
      />
    </main>
  );
}
