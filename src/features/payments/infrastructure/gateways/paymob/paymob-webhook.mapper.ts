import type { ProcessWebhookRequest } from '@/features/payments/application/contracts/process-webhook.request';
import { WebhookError } from '@/features/payments/application/errors/webhook.errors';
import { PaymentProvider } from '@/features/payments/domain';

type PaymobSourceData = {
  pan?: string;
  type?: string;
  sub_type?: string;
};

type PaymobTransactionObj = {
  id?: number | string;
  success?: boolean | string;
  pending?: boolean | string;
  amount_cents?: number | string;
  currency?: string;
  integration_id?: number | string;
  error_occured?: boolean | string;
  created_at?: string;
  data?: { message?: string };
  source_data?: PaymobSourceData;
  order?: {
    id?: number | string;
    merchant_order_id?: string;
  };
  /** Set by Intention API as `special_reference` — our internal order id. */
  special_reference?: string;
  merchant_order_id?: string;
  extras?: { orderId?: string; userId?: string };
};

export type PaymobWebhookPayload = {
  type?: string;
  obj?: PaymobTransactionObj;
  /** Some Paymob deliveries nest the transaction under `obj` only. */
};

function asBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  return Boolean(value);
}

function resolveOrderId(obj: PaymobTransactionObj): string | null {
  if (typeof obj.special_reference === 'string' && obj.special_reference) {
    return obj.special_reference;
  }

  if (
    typeof obj.extras?.orderId === 'string' &&
    obj.extras.orderId.length > 0
  ) {
    return obj.extras.orderId;
  }

  if (
    typeof obj.order?.merchant_order_id === 'string' &&
    obj.order.merchant_order_id.length > 0
  ) {
    return obj.order.merchant_order_id;
  }

  if (
    typeof obj.merchant_order_id === 'string' &&
    obj.merchant_order_id.length > 0
  ) {
    return obj.merchant_order_id;
  }

  return null;
}

/**
 * Maps a verified Paymob processed-transaction payload into the
 * application-layer `ProcessWebhookRequest`. Provider-specific parsing stays
 * in infrastructure.
 */
export function mapPaymobWebhookToProcessRequest(input: {
  payload: unknown;
  hmac: string;
}): {
  request: ProcessWebhookRequest;
  transaction: Record<string, unknown>;
} {
  const payload = input.payload as PaymobWebhookPayload;
  const obj = payload?.obj;

  if (!obj || typeof obj !== 'object') {
    throw new WebhookError(
      400,
      'صيغة إشعار الدفع غير صالحة',
      'VALIDATION_ERROR',
    );
  }

  const orderId = resolveOrderId(obj);
  if (!orderId) {
    throw new WebhookError(
      400,
      'معرف الطلب مفقود في إشعار الدفع',
      'VALIDATION_ERROR',
    );
  }

  const providerTransactionId = obj.id != null ? String(obj.id) : null;
  if (!providerTransactionId) {
    throw new WebhookError(
      400,
      'معرف معاملة المزود مفقود',
      'VALIDATION_ERROR',
    );
  }

  const success = asBoolean(obj.success) && !asBoolean(obj.error_occured);
  const type = payload.type ?? 'TRANSACTION';

  return {
    transaction: obj as Record<string, unknown>,
    request: {
      provider: PaymentProvider.PAYMOB,
      providerEventId: `${type}_${providerTransactionId}`,
      type,
      payload: input.payload,
      outcome: success ? 'succeeded' : 'failed',
      orderId,
      providerTransactionId,
      paymentMethod: obj.source_data?.type ?? null,
      last4: obj.source_data?.pan ?? null,
      brand: obj.source_data?.sub_type ?? null,
      integrationId:
        obj.integration_id != null ? Number(obj.integration_id) : null,
      failureCode: success ? null : 'PAYMOB_TRANSACTION_FAILED',
      failureMessage: success
        ? null
        : (obj.data?.message ?? 'Payment failed at provider'),
    },
  };
}
