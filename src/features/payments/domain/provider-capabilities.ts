import { PaymentProvider } from './payment-provider';

export type ProviderCapability =
  | 'checkout'
  | 'inquiry'
  | 'webhooks'
  | 'refunds'
  | 'disputes'
  | 'partial_capture';

export type ProviderCapabilityMatrix = Record<
  PaymentProvider,
  readonly ProviderCapability[]
>;

/**
 * Declares what each PSP supports today. Used for routing and ops tooling.
 */
export const PROVIDER_CAPABILITIES: Partial<ProviderCapabilityMatrix> = {
  [PaymentProvider.PAYMOB]: ['checkout', 'inquiry', 'webhooks', 'refunds'],
  [PaymentProvider.STRIPE]: [
    'checkout',
    'inquiry',
    'webhooks',
    'refunds',
    'disputes',
    'partial_capture',
  ],
  [PaymentProvider.PAYPAL]: ['checkout', 'webhooks', 'refunds', 'disputes'],
  [PaymentProvider.CASH]: ['checkout'],
};

export function providerSupports(
  provider: PaymentProvider,
  capability: ProviderCapability,
): boolean {
  return PROVIDER_CAPABILITIES[provider]?.includes(capability) ?? false;
}
