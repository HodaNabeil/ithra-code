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
  /** Paymob Pixel embed — safe to expose to the client. */
  clientSecret?: string;
  publicKey?: string;
};

/**
 * Gateway-agnostic inquiry outcomes. Independent from PaymentStatus.
 * Adapters map provider HTTP quirks here; ReconciliationPolicy decides side effects.
 */
export type ProviderPaymentOutcome =
  | 'succeeded'
  | 'failed'
  | 'pending'
  | 'not_found'
  | 'transient_error'
  | 'ambiguous';

export type ProviderPaymentStatus = {
  outcome: ProviderPaymentOutcome;
  providerTransactionId?: string;
  amountCents?: number;
  currency?: Currency;
  providerMetadata?: unknown;
  paymentMethod?: string | null;
  last4?: string | null;
  brand?: string | null;
  integrationId?: number | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  /** Optional HTTP status from the inquiry call (ops / attempt history). */
  httpStatus?: number;
  detail?: string;
};

export type GetPaymentStatusInput = {
  /** Internal order id (Paymob `special_reference` / `merchant_order_id`). */
  orderId: string;
  providerTransactionId?: string | null;
  /** Provider checkout/session/intention id when available. */
  providerSessionId?: string | null;
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

  /** Queries the provider for the authoritative payment state (reconciliation). */
  getPaymentStatus(
    input: GetPaymentStatusInput,
  ): Promise<ProviderPaymentStatus>;
}
