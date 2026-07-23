import axios, { isAxiosError } from 'axios';
import { logger } from '@/lib/logger';
import { PaymentProvider } from '@/features/payments/domain';
import {
  CheckoutError,
  type CreateProviderCheckoutInput,
  type PaymentProviderGateway,
  type ProviderCheckoutResult,
} from '@/features/payments/application';
import type { PaymobConfig } from './paymob.config';
import { verifyPaymobTransactionHmac } from './paymob.hmac';

const REQUEST_TIMEOUT_MS = 15_000;
const SESSION_TTL_MS = 1000 * 60 * 60;

type IntentionResponse = {
  id?: string | number;
  client_secret?: string;
};

/**
 * Concrete Paymob implementation of the provider-agnostic
 * `PaymentProviderGateway`. Uses Paymob's Intention API and unified checkout.
 *
 * The Application layer depends only on `PaymentProviderGateway`; this class is
 * selected at the composition root and is never imported by domain/application.
 */
export class PaymobGateway implements PaymentProviderGateway {
  readonly provider: PaymentProvider = PaymentProvider.PAYMOB;

  constructor(private readonly config: PaymobConfig) {}

  async createCheckoutSession(
    input: CreateProviderCheckoutInput,
  ): Promise<ProviderCheckoutResult> {
    try {
      const { data } = await axios.post<IntentionResponse>(
        `${this.config.apiUrl}/v1/intention/`,
        {
          amount: input.amountCents,
          currency: input.currency,
          payment_methods: this.config.integrationIds,
          // `special_reference` is unique per order and lets Paymob dedupe retries.
          special_reference: input.orderId,
          redirection_url: input.successUrl,
          extras: { orderId: input.orderId, userId: input.userId },
          // Billing data is required by Paymob. A production build loads the
          // authenticated user's profile; placeholders keep the contract valid.
          billing_data: {
            first_name: 'NA',
            last_name: 'NA',
            email: 'na@ithracode.com',
            phone_number: 'NA',
            apartment: 'NA',
            floor: 'NA',
            street: 'NA',
            building: 'NA',
            shipping_method: 'NA',
            postal_code: 'NA',
            city: 'NA',
            country: 'NA',
            state: 'NA',
          },
          items: [],
        },
        {
          headers: {
            Authorization: `Token ${this.config.secretKey}`,
            'Content-Type': 'application/json',
          },
          timeout: REQUEST_TIMEOUT_MS,
        },
      );

      if (!data.client_secret) {
        throw new CheckoutError(
          502,
          'تعذر إنشاء جلسة الدفع',
          'PROVIDER_UNAVAILABLE',
        );
      }

      const redirectUrl =
        `${this.config.apiUrl}/unifiedcheckout/` +
        `?publicKey=${encodeURIComponent(this.config.publicKey)}` +
        `&clientSecret=${encodeURIComponent(data.client_secret)}`;

      return {
        providerSessionId: String(data.id ?? input.orderId),
        redirectUrl,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        clientSecret: data.client_secret,
        publicKey: this.config.publicKey,
      };
    } catch (error) {
      if (error instanceof CheckoutError) {
        throw error;
      }

      logger.error(
        {
          error: isAxiosError(error) ? error.response?.data : String(error),
          orderId: input.orderId,
        },
        '[PAYMOB_CREATE_SESSION_ERROR]',
      );

      throw new CheckoutError(
        503,
        'مزود الدفع غير متاح حالياً',
        'PROVIDER_UNAVAILABLE',
      );
    }
  }

  /** Verifies a processed-transaction webhook HMAC (provider-specific). */
  verifyWebhookHmac(input: {
    transaction: Record<string, unknown>;
    receivedHmac: string;
  }): boolean {
    return verifyPaymobTransactionHmac({
      transaction: input.transaction,
      receivedHmac: input.receivedHmac,
      hmacSecret: this.config.hmacSecret,
    });
  }
}
