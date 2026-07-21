import { randomUUID } from 'node:crypto';
import type { PaymentProvider } from '@/features/payments/domain';
import type {
  CreateProviderCheckoutInput,
  PaymentProviderGateway,
  ProviderCheckoutResult,
} from '@/features/payments/application';

const SESSION_TTL_MS = 1000 * 60 * 30;

/**
 * Deterministic in-memory gateway used to validate the entire checkout
 * workflow (validation, pricing, persistence, Unit of Work, session save,
 * redirect contract) without any external provider dependency.
 *
 * Kept permanently as the CI/test double even after Paymob is integrated.
 */
export class FakePaymentGateway implements PaymentProviderGateway {
  constructor(public readonly provider: PaymentProvider) {}

  async createCheckoutSession(
    input: CreateProviderCheckoutInput,
  ): Promise<ProviderCheckoutResult> {
    const providerSessionId = `fake_${randomUUID()}`;

    const query = new URLSearchParams({
      session: providerSessionId,
      order: input.orderId,
      amount: String(input.amountCents),
      currency: input.currency,
    });

    const separator = input.successUrl.includes('?') ? '&' : '?';

    return {
      providerSessionId,
      redirectUrl: `${input.successUrl}${separator}${query.toString()}`,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    };
  }
}
