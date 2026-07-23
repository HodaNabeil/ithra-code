import type { CheckoutSessionEntity } from '@/features/payments/domain';

/** Successful checkout orchestration result returned to the presentation layer. */
export type CreateCheckoutResponse = {
  checkoutSession: CheckoutSessionEntity;
  redirectUrl: string;
  expiresAt: Date;
  /** Present when the provider supports embedded checkout (Paymob Pixel). */
  clientSecret?: string;
  publicKey?: string;
};
