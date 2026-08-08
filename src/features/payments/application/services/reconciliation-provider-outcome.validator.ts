import type { Currency } from '@/generated/prisma/enums';
import type { ProviderPaymentStatus } from '../providers/payment-provider.gateway';
import type { ProcessWebhookRequest } from '../contracts/process-webhook.request';
import { WebhookError } from '../errors/webhook.errors';

export type ReconcilePaymentSnapshot = {
  amountCents: number;
  currency: Currency;
};

/**
 * Normalizes provider inquiry results before policy / fulfillment.
 * Rejects financially unsafe "succeeded" outcomes (missing txn id, amount drift).
 */
export function normalizeProviderOutcomeForReconcile(
  status: ProviderPaymentStatus,
  payment: ReconcilePaymentSnapshot,
): ProviderPaymentStatus {
  return validateSuccessfulProviderOutcome(status, payment);
}

function validateSuccessfulProviderOutcome(
  status: ProviderPaymentStatus,
  payment: ReconcilePaymentSnapshot,
): ProviderPaymentStatus {
  if (status.outcome !== 'succeeded') {
    return status;
  }

  if (!status.providerTransactionId?.trim()) {
    return {
      ...status,
      outcome: 'ambiguous',
      failureCode: 'MISSING_PROVIDER_TRANSACTION_ID',
      failureMessage:
        'Provider reported success without a transaction id — cannot fulfill',
      detail:
        status.detail ??
        'Provider reported success without a transaction id — cannot fulfill',
    };
  }

  if (status.amountCents == null) {
    return {
      ...status,
      outcome: 'ambiguous',
      failureCode: 'MISSING_PROVIDER_AMOUNT',
      failureMessage:
        'Provider reported success without an amount — cannot fulfill',
      detail:
        status.detail ??
        'Provider reported success without an amount — cannot fulfill',
    };
  }

  if (status.amountCents !== payment.amountCents) {
    return {
      ...status,
      outcome: 'ambiguous',
      failureCode: 'AMOUNT_MISMATCH',
      failureMessage: `Provider amount ${status.amountCents} does not match payment ${payment.amountCents}`,
      detail: `Provider amount ${status.amountCents} does not match payment ${payment.amountCents}`,
    };
  }

  if (status.currency == null) {
    return {
      ...status,
      outcome: 'ambiguous',
      failureCode: 'MISSING_PROVIDER_CURRENCY',
      failureMessage:
        'Provider reported success without a currency — cannot fulfill',
      detail:
        status.detail ??
        'Provider reported success without a currency — cannot fulfill',
    };
  }

  if (status.currency !== payment.currency) {
    return {
      ...status,
      outcome: 'ambiguous',
      failureCode: 'CURRENCY_MISMATCH',
      failureMessage: `Provider currency ${status.currency} does not match payment ${payment.currency}`,
      detail: `Provider currency ${status.currency} does not match payment ${payment.currency}`,
    };
  }

  return status;
}

/**
 * Validates webhook success payloads against the stored payment before fulfillment.
 * @throws {WebhookError} when amount/currency/txn id are unsafe.
 */
export function assertWebhookSuccessMatchesPayment(
  request: ProcessWebhookRequest,
  payment: ReconcilePaymentSnapshot,
): void {
  if (request.outcome !== 'succeeded') {
    return;
  }

  const normalized = validateSuccessfulProviderOutcome(
    {
      outcome: 'succeeded',
      providerTransactionId: request.providerTransactionId,
      amountCents: request.amountCents ?? undefined,
      currency: request.currency ?? undefined,
    },
    payment,
  );

  if (normalized.outcome !== 'succeeded') {
    throw new WebhookError(
      422,
      'بيانات الدفع من المزود لا تطابق الطلب',
      'VALIDATION_ERROR',
    );
  }
}
