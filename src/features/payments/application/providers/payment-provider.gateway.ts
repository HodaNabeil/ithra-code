import type { Currency } from '@/generated/prisma/enums';
import type { PaymentProvider } from '@/features/payments/domain';

export type CreateProviderCheckoutInput = {
  orderId: string;
  userId: string;
  provider: PaymentProvider;
  amountCents: number;
  currency: Currency;
  successUrl: string;
  cancelUrl: string;
};

export type ProviderCheckoutResult = {
  providerSessionId: string;
  redirectUrl: string;
  expiresAt: Date;
};

/**
 * Provider-agnostic gateway for creating external checkout sessions.
 * Concrete implementations (Paymob, Stripe, etc.) live in infrastructure.
 */
export interface PaymentProviderGateway {
  readonly provider: PaymentProvider;

  createCheckoutSession(
    input: CreateProviderCheckoutInput,
  ): Promise<ProviderCheckoutResult>;
}
