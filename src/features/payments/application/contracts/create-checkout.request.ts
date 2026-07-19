import type { PaymentProvider } from '@/features/payments/domain';

/** Input contract for initiating a server-side checkout session. */
export type CreateCheckoutRequest = {
  userId: string;
  provider: PaymentProvider;
  successUrl: string;
  cancelUrl: string;
};
