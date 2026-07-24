import { randomUUID } from 'node:crypto';
import type { PaymentProvider } from '@/features/payments/domain';
import type {
  CreateProviderCheckoutInput,
  GetPaymentStatusInput,
  PaymentProviderGateway,
  ProviderCheckoutResult,
  ProviderPaymentStatus,
} from '@/features/payments/application';
import type { PaymentInquiryPort } from '@/features/payments/application/ports/payment-inquiry.port';

const SESSION_TTL_MS = 1000 * 60 * 30;

const reconcileOutcomes = new Map<string, ProviderPaymentStatus>();

/**
 * Deterministic in-memory gateway used to validate the entire checkout
 * workflow (validation, pricing, persistence, Unit of Work, session save,
 * redirect contract) without any external provider dependency.
 *
 * Kept permanently as the CI/test double even after Paymob is integrated.
 */
export class FakePaymentGateway
  implements PaymentProviderGateway, PaymentInquiryPort
{
  constructor(public readonly provider: PaymentProvider) {}

  /** Test helper: seed reconciliation outcomes by order id. */
  static setReconcileOutcome(
    orderId: string,
    status: ProviderPaymentStatus,
  ): void {
    reconcileOutcomes.set(orderId, status);
  }

  static clearReconcileOutcomes(): void {
    reconcileOutcomes.clear();
  }

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

  async getPaymentStatus(
    input: GetPaymentStatusInput,
  ): Promise<ProviderPaymentStatus> {
    return this.inquire(input);
  }

  async inquire(input: GetPaymentStatusInput): Promise<ProviderPaymentStatus> {
    return reconcileOutcomes.get(input.orderId) ?? { outcome: 'pending' };
  }
}
