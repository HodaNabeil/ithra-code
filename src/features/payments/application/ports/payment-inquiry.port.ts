import type { PaymentProvider } from '@/features/payments/domain';
import type {
  GetPaymentStatusInput,
  ProviderPaymentStatus,
} from '../providers/payment-provider.gateway';

/**
 * Read-only port for provider payment inquiry (reconciliation).
 * Separated from checkout session creation for multi-PSP scaling.
 */
export interface PaymentInquiryPort {
  readonly provider: PaymentProvider;

  inquire(input: GetPaymentStatusInput): Promise<ProviderPaymentStatus>;
}

export type PaymentInquiryRegistry = Partial<
  Record<PaymentProvider, PaymentInquiryPort>
>;
