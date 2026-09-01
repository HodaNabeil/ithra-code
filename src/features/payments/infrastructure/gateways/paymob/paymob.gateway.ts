import axios, { isAxiosError } from 'axios';
import { env } from '@/config';
import { logger } from '@/lib/logger';
import { PaymentProvider } from '@/features/payments/domain';
import {
  CheckoutError,
  type CreateProviderCheckoutInput,
  type GetPaymentStatusInput,
  type PaymentProviderGateway,
  type ProviderCheckoutResult,
  type ProviderPaymentStatus,
} from '@/features/payments/application';
import type { PaymentInquiryPort } from '@/features/payments/application/ports/payment-inquiry.port';
import type { PaymobConfig } from './paymob.config';
import { verifyPaymobTransactionHmac } from './paymob.hmac';
import { resolvePaymobProviderStatus } from './paymob-transaction-inquiry';
import {
  executeWithHttpRetry,
  isRetryableHttpError,
} from '../../http/http-retry.executor';
import {
  CircuitOpenError,
  HttpCircuitBreaker,
} from '../../http/http-circuit-breaker';

const SESSION_TTL_MS = 1000 * 60 * 60;
/** Auth tokens from /api/auth/tokens are short-lived; refresh before expiry. */
const AUTH_TOKEN_TTL_MS = 1000 * 60 * 50;

type IntentionResponse = {
  id?: string | number;
  client_secret?: string;
};

type AuthTokenResponse = {
  token?: string;
};

function summarizePaymobError(error: unknown): {
  status?: number;
  detail?: string;
} {
  if (!isAxiosError(error)) {
    return { detail: String(error) };
  }

  const status = error.response?.status;
  const data = error.response?.data;

  if (typeof data === 'string') {
    const trimmed = data.trim();
    const isHtml = trimmed.startsWith('<') || trimmed.includes('<html');
    return {
      status,
      detail: isHtml
        ? `HTML ${status ?? 'error'} from Paymob (likely wrong URL/method)`
        : trimmed.slice(0, 200),
    };
  }

  if (data && typeof data === 'object') {
    const detail =
      'detail' in data && typeof data.detail === 'string'
        ? data.detail
        : JSON.stringify(data).slice(0, 200);
    return { status, detail };
  }

  return { status, detail: error.message };
}

/**
 * Concrete Paymob implementation of the provider-agnostic
 * `PaymentProviderGateway`. Uses Paymob's Intention API and unified checkout.
 */
export class PaymobGateway
  implements PaymentProviderGateway, PaymentInquiryPort
{
  readonly provider: PaymentProvider = PaymentProvider.PAYMOB;

  private cachedAuthToken: { token: string; expiresAt: number } | null = null;
  private readonly inquiryCircuitBreaker: HttpCircuitBreaker;

  constructor(private readonly config: PaymobConfig) {
    this.inquiryCircuitBreaker = new HttpCircuitBreaker({
      failureThreshold: env.PAYMOB_CIRCUIT_BREAKER_THRESHOLD,
      resetMs: env.PAYMOB_CIRCUIT_BREAKER_RESET_MS,
    });
  }

  async createCheckoutSession(
    input: CreateProviderCheckoutInput,
  ): Promise<ProviderCheckoutResult> {
    try {
      const { data } = await executeWithHttpRetry(
        () =>
          axios.post<IntentionResponse>(
            `${this.config.apiUrl}/v1/intention/`,
            {
              amount: input.amountCents,
              currency: input.currency,
              payment_methods: this.config.integrationIds,
              special_reference: input.orderId,
              redirection_url: input.successUrl,
              extras: { orderId: input.orderId, userId: input.userId },
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
              timeout: env.PAYMOB_TIMEOUT_MS,
            },
          ),
        {
          maxAttempts: env.PAYMOB_RETRY_MAX,
          initialDelayMs: env.PAYMOB_RETRY_INITIAL_MS,
        },
        { orderId: input.orderId, operation: 'createCheckoutSession' },
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

      if (isAxiosError(error) && !isRetryableHttpError(error)) {
        logger.error(
          {
            error: summarizePaymobError(error),
            orderId: input.orderId,
            status: error.response?.status,
          },
          '[PAYMOB_CREATE_SESSION_ERROR]',
        );
      }

      throw new CheckoutError(
        503,
        'مزود الدفع غير متاح حالياً',
        'PROVIDER_UNAVAILABLE',
      );
    }
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput,
  ): Promise<ProviderPaymentStatus> {
    return this.inquire(input);
  }

  async inquire(input: GetPaymentStatusInput): Promise<ProviderPaymentStatus> {
    try {
      return await this.inquiryCircuitBreaker.execute(() =>
        this.inquireInternal(input),
      );
    } catch (error) {
      if (error instanceof CircuitOpenError) {
        return {
          outcome: 'transient_error',
          failureCode: 'PAYMOB_CIRCUIT_OPEN',
          failureMessage: error.message,
          detail: error.message,
        };
      }

      throw error;
    }
  }

  private async inquireInternal(
    input: GetPaymentStatusInput,
  ): Promise<ProviderPaymentStatus> {
    const authToken = await this.getAuthToken(input.orderId);
    if (!authToken) {
      return {
        outcome: 'transient_error',
        failureCode: 'PAYMOB_AUTH_UNAVAILABLE',
        failureMessage: 'Unable to mint Paymob auth token for inquiry',
      };
    }

    if (input.providerTransactionId) {
      try {
        const { data } = await executeWithHttpRetry(
          () =>
            axios.get(
              `${this.config.apiUrl}/api/acceptance/transactions/${input.providerTransactionId}`,
              {
                params: { token: authToken },
                timeout: env.PAYMOB_TIMEOUT_MS,
              },
            ),
          {
            maxAttempts: env.PAYMOB_RETRY_MAX,
            initialDelayMs: env.PAYMOB_RETRY_INITIAL_MS,
          },
          {
            orderId: input.orderId,
            operation: 'getPaymentStatusByTransactionId',
          },
        );

        return resolvePaymobProviderStatus(data);
      } catch (error) {
        const summarized = summarizePaymobError(error);
        if (summarized.status === 404) {
          // Fall through to merchant_order_id inquiry.
        } else if (summarized.status != null && summarized.status >= 500) {
          return {
            outcome: 'transient_error',
            httpStatus: summarized.status,
            detail: summarized.detail,
            failureCode: 'PAYMOB_TRANSIENT',
            failureMessage: summarized.detail,
          };
        } else {
          logger.warn(
            {
              error: summarized,
              orderId: input.orderId,
              providerTransactionId: input.providerTransactionId,
            },
            '[PAYMOB_GET_PAYMENT_STATUS_ERROR]',
          );
        }
      }
    }

    try {
      // Official inquiry is POST without a trailing slash.
      // Trailing slash returns HTML 404 from Paymob's edge.
      const { data } = await executeWithHttpRetry(
        () =>
          axios.post(
            `${this.config.apiUrl}/api/ecommerce/orders/transaction_inquiry`,
            {
              auth_token: authToken,
              merchant_order_id: input.orderId,
            },
            {
              headers: { 'Content-Type': 'application/json' },
              timeout: env.PAYMOB_TIMEOUT_MS,
            },
          ),
        {
          maxAttempts: env.PAYMOB_RETRY_MAX,
          initialDelayMs: env.PAYMOB_RETRY_INITIAL_MS,
        },
        { orderId: input.orderId, operation: 'transactionInquiry' },
      );

      return resolvePaymobProviderStatus(data);
    } catch (error) {
      const summarized = summarizePaymobError(error);

      // Inconclusive — never map a single 404 to FAILED. Policy decides abandon.
      if (
        summarized.status === 404 &&
        typeof summarized.detail === 'string' &&
        /not found/i.test(summarized.detail)
      ) {
        logger.info(
          { orderId: input.orderId, detail: summarized.detail },
          '[PAYMOB_TRANSACTION_NOT_FOUND]',
        );

        return {
          outcome: 'not_found',
          httpStatus: 404,
          detail: summarized.detail,
          failureMessage: summarized.detail,
        };
      }

      if (
        summarized.status === 429 ||
        (summarized.status != null && summarized.status >= 500) ||
        !summarized.status
      ) {
        logger.warn(
          { error: summarized, orderId: input.orderId },
          '[PAYMOB_TRANSACTION_INQUIRY_ERROR]',
        );
        return {
          outcome: 'transient_error',
          httpStatus: summarized.status,
          detail: summarized.detail,
          failureCode: 'PAYMOB_TRANSIENT',
          failureMessage: summarized.detail,
        };
      }

      logger.warn(
        { error: summarized, orderId: input.orderId },
        '[PAYMOB_TRANSACTION_INQUIRY_ERROR]',
      );

      return {
        outcome: 'ambiguous',
        httpStatus: summarized.status,
        detail: summarized.detail,
        failureCode: 'PAYMOB_AMBIGUOUS',
        failureMessage: summarized.detail,
      };
    }
  }

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

  /**
   * Inquiry APIs require a short-lived auth token minted from the legacy
   * API key — Intention Secret Key alone is rejected by Paymob.
   */
  private async getAuthToken(orderId: string): Promise<string | null> {
    if (!this.config.apiKey) {
      logger.warn(
        { orderId },
        '[PAYMOB_API_KEY_MISSING] Set PAYMOB_API_KEY for transaction inquiry / reconciliation',
      );
      return null;
    }

    const now = Date.now();
    if (this.cachedAuthToken && this.cachedAuthToken.expiresAt > now) {
      return this.cachedAuthToken.token;
    }

    try {
      const { data } = await executeWithHttpRetry(
        () =>
          axios.post<AuthTokenResponse>(
            `${this.config.apiUrl}/api/auth/tokens`,
            { api_key: this.config.apiKey },
            {
              headers: { 'Content-Type': 'application/json' },
              timeout: env.PAYMOB_TIMEOUT_MS,
            },
          ),
        {
          maxAttempts: env.PAYMOB_RETRY_MAX,
          initialDelayMs: env.PAYMOB_RETRY_INITIAL_MS,
        },
        { orderId, operation: 'getAuthToken' },
      );

      if (!data.token) {
        logger.warn(
          { orderId },
          '[PAYMOB_AUTH_TOKEN_MISSING] Paymob auth/tokens returned no token',
        );
        return null;
      }

      this.cachedAuthToken = {
        token: data.token,
        expiresAt: now + AUTH_TOKEN_TTL_MS,
      };

      return data.token;
    } catch (error) {
      logger.warn(
        { error: summarizePaymobError(error), orderId },
        '[PAYMOB_AUTH_TOKEN_ERROR]',
      );
      return null;
    }
  }
}
