import type { PaymentProvider } from '@/features/payments/domain';
import { isSupportedPaymentProvider } from '@/features/payments/domain';
import { CheckoutError } from '../errors/checkout.errors';
import type { PaymentProviderGateway } from './payment-provider.gateway';

export type PaymentProviderRegistry = Partial<
  Record<PaymentProvider, PaymentProviderGateway>
>;

/**
 * Resolves the payment provider gateway for a supported provider.
 * Provider implementations are registered at composition root.
 */
export class PaymentProviderResolver {
  constructor(private readonly registry: PaymentProviderRegistry = {}) {}

  /**
   * Returns the gateway for the requested provider.
   * @throws {CheckoutError} when the provider is unsupported or not registered.
   */
  resolve(provider: PaymentProvider): PaymentProviderGateway {
    if (!isSupportedPaymentProvider(provider)) {
      throw new CheckoutError(
        400,
        'مزود الدفع غير مدعوم',
        'UNSUPPORTED_PROVIDER',
      );
    }

    const gateway = this.registry[provider];

    if (!gateway) {
      // TODO: Register concrete provider gateways (Paymob, Stripe, PayPal) in infrastructure.
      throw new CheckoutError(
        503,
        'مزود الدفع غير متاح حالياً',
        'PROVIDER_UNAVAILABLE',
      );
    }

    return gateway;
  }
}
