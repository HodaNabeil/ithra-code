import type { CheckoutSessionEntity } from '@/features/payments/domain';

/** Successful checkout orchestration result returned to the presentation layer. */
export type CreateCheckoutResponse = {
  checkoutSession: CheckoutSessionEntity;
  redirectUrl: string;
  expiresAt: Date;
};
