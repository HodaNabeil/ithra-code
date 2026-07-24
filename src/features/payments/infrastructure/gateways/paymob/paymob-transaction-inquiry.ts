import type { Currency } from '@/generated/prisma/enums';
import type { ProviderPaymentStatus } from '@/features/payments/application';

type PaymobTransactionLike = {
  id?: number | string;
  amount_cents?: number | string;
  currency?: string;
  success?: boolean | string;
  pending?: boolean | string;
  error_occured?: boolean | string;
  is_voided?: boolean | string;
  is_refunded?: boolean | string;
  source_data?: {
    pan?: string;
    type?: string;
    sub_type?: string;
  };
  integration_id?: number | string;
  data?: { message?: string };
};

function asBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  return Boolean(value);
}

function pickLatestTransaction(
  transactions: PaymobTransactionLike[],
): PaymobTransactionLike | null {
  if (transactions.length === 0) {
    return null;
  }

  return transactions[transactions.length - 1] ?? null;
}

function parseAmountCents(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value);
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.round(parsed) : undefined;
  }

  return undefined;
}

function parseCurrency(value: unknown): Currency | undefined {
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined;
  }

  return value.toUpperCase() as Currency;
}

function withMoneyFields(
  status: ProviderPaymentStatus,
  transaction: PaymobTransactionLike,
): ProviderPaymentStatus {
  return {
    ...status,
    amountCents: parseAmountCents(transaction.amount_cents),
    currency: parseCurrency(transaction.currency),
  };
}

/** Maps a Paymob transaction object to the provider-agnostic status contract. */
export function mapPaymobTransactionToProviderStatus(
  transaction: PaymobTransactionLike | null,
): ProviderPaymentStatus {
  if (!transaction) {
    return { outcome: 'not_found', detail: 'No transaction in provider payload' };
  }

  if (asBoolean(transaction.is_voided) || asBoolean(transaction.is_refunded)) {
    return withMoneyFields(
      {
        outcome: 'failed',
        providerTransactionId:
          transaction.id != null ? String(transaction.id) : undefined,
        providerMetadata: transaction,
        failureCode: 'PAYMOB_VOIDED_OR_REFUNDED',
        failureMessage: 'Payment voided or refunded at provider',
      },
      transaction,
    );
  }

  if (asBoolean(transaction.pending)) {
    return withMoneyFields(
      {
        outcome: 'pending',
        providerTransactionId:
          transaction.id != null ? String(transaction.id) : undefined,
        providerMetadata: transaction,
      },
      transaction,
    );
  }

  const success =
    asBoolean(transaction.success) && !asBoolean(transaction.error_occured);

  if (success) {
    return withMoneyFields(
      {
        outcome: 'succeeded',
        providerTransactionId:
          transaction.id != null ? String(transaction.id) : undefined,
        providerMetadata: transaction,
        paymentMethod: transaction.source_data?.type ?? null,
        last4: transaction.source_data?.pan ?? null,
        brand: transaction.source_data?.sub_type ?? null,
        integrationId:
          transaction.integration_id != null
            ? Number(transaction.integration_id)
            : null,
      },
      transaction,
    );
  }

  return withMoneyFields(
    {
      outcome: 'failed',
      providerTransactionId:
        transaction.id != null ? String(transaction.id) : undefined,
      providerMetadata: transaction,
      failureCode: 'PAYMOB_TRANSACTION_FAILED',
      failureMessage: transaction.data?.message ?? 'Payment failed at provider',
    },
    transaction,
  );
}

export function extractPaymobTransactions(
  payload: unknown,
): PaymobTransactionLike[] {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const root = payload as Record<string, unknown>;

  if (Array.isArray(root)) {
    return root as PaymobTransactionLike[];
  }

  if (Array.isArray(root.transactions)) {
    return root.transactions as PaymobTransactionLike[];
  }

  if (root.obj && typeof root.obj === 'object') {
    return [root.obj as PaymobTransactionLike];
  }

  if ('id' in root) {
    return [root as PaymobTransactionLike];
  }

  return [];
}

export function resolvePaymobProviderStatus(
  payload: unknown,
): ProviderPaymentStatus {
  const transactions = extractPaymobTransactions(payload);
  return mapPaymobTransactionToProviderStatus(
    pickLatestTransaction(transactions),
  );
}
