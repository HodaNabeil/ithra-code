/**
 * Payment API paths (relative to NEXT_PUBLIC_API_URL, which includes `/api`).
 */
export const PAYMENT_ENDPOINTS = {
  CHECKOUT: '/payment/checkout',
} as const;

/** Providers exposed in the checkout UI. Values match the API schema. */
export const CHECKOUT_PROVIDERS = {
  PAYMOB: 'PAYMOB',
  /** Dev-only UI option — sends CASH (backed by FakePaymentGateway). */
  FAKE: 'CASH',
} as const;

export type CheckoutProviderApiValue =
  (typeof CHECKOUT_PROVIDERS)[keyof typeof CHECKOUT_PROVIDERS];
