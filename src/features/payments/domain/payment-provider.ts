import { PaymentProvider } from '@/generated/prisma/enums';

export { PaymentProvider };

export const SUPPORTED_PAYMENT_PROVIDERS = [
  PaymentProvider.PAYMOB,
  PaymentProvider.STRIPE,
  PaymentProvider.PAYPAL,
  PaymentProvider.CASH,
] as const;

export function isSupportedPaymentProvider(
  provider: string,
): provider is PaymentProvider {
  return SUPPORTED_PAYMENT_PROVIDERS.includes(provider as PaymentProvider);
}
