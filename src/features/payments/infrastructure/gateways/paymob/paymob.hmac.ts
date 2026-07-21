import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Fields Paymob concatenates (in this exact lexical order) to compute the HMAC
 * of a processed-transaction callback. See Paymob "HMAC Calculation" docs.
 */
const TRANSACTION_HMAC_FIELDS = [
  'amount_cents',
  'created_at',
  'currency',
  'error_occured',
  'has_parent_transaction',
  'id',
  'integration_id',
  'is_3d_secure',
  'is_auth',
  'is_capture',
  'is_refunded',
  'is_standalone_payment',
  'is_voided',
  'order.id',
  'owner',
  'pending',
  'source_data.pan',
  'source_data.sub_type',
  'source_data.type',
  'success',
] as const;

type PaymobTransaction = Record<string, unknown> & {
  order?: { id?: unknown };
  source_data?: {
    pan?: unknown;
    sub_type?: unknown;
    type?: unknown;
  };
};

function readField(transaction: PaymobTransaction, path: string): string {
  const value = path
    .split('.')
    .reduce<unknown>(
      (acc, key) =>
        acc && typeof acc === 'object'
          ? (acc as Record<string, unknown>)[key]
          : undefined,
      transaction,
    );

  if (value === undefined || value === null) {
    return '';
  }

  return String(value);
}

/**
 * Verifies a Paymob transaction callback HMAC (HMAC-SHA512) using a
 * constant-time comparison. Verification is provider-specific and intentionally
 * kept in infrastructure rather than on the shared `PaymentProviderGateway`.
 */
export function verifyPaymobTransactionHmac(input: {
  transaction: PaymobTransaction;
  receivedHmac: string;
  hmacSecret: string;
}): boolean {
  const concatenated = TRANSACTION_HMAC_FIELDS.map((field) =>
    readField(input.transaction, field),
  ).join('');

  const computed = createHmac('sha512', input.hmacSecret)
    .update(concatenated)
    .digest('hex');

  const received = input.receivedHmac.trim().toLowerCase();

  if (computed.length !== received.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(computed), Buffer.from(received));
}
