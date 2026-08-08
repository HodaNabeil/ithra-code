import { createHash } from 'node:crypto';
import type { PaymentProvider } from '@/features/payments/domain';
import type { PriceCalculationResult } from './price-calculator.service';

export type CheckoutFingerprintInput = {
  courseIds: string[];
  couponId: string | null;
  totalCents: number;
  currency: string;
  provider: PaymentProvider;
};

/**
 * Deterministic cart fingerprint for pending-order reuse.
 */
export class CheckoutFingerprintService {
  compute(input: CheckoutFingerprintInput): string {
    const courseIds = [...input.courseIds].sort();
    const payload = [
      courseIds.join(','),
      input.couponId ?? '',
      String(input.totalCents),
      input.currency,
      input.provider,
    ].join('|');

    return createHash('sha256').update(payload).digest('hex');
  }

  fromPricing(
    pricing: PriceCalculationResult,
    provider: PaymentProvider,
  ): string {
    return this.compute({
      courseIds: pricing.items.map((item) => item.courseId),
      couponId: pricing.couponId,
      totalCents: pricing.totalCents,
      currency: pricing.currency,
      provider,
    });
  }
}
