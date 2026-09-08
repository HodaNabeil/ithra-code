import { PaymentProvider } from '@/generated/prisma/enums';

export { PaymentProvider };

export const SUPPORTED_PAYMENT_PROVIDERS = [
  PaymentProvider.PAYMOB,
  PaymentProvider.PAYPAL,
  PaymentProvider.CASH,
] as const;

export type SupportedPaymentProvider =
  (typeof SUPPORTED_PAYMENT_PROVIDERS)[number];

export function isSupportedPaymentProvider(
  provider: string,
): provider is SupportedPaymentProvider {
  return (SUPPORTED_PAYMENT_PROVIDERS as readonly string[]).includes(
    provider,
  );
}
