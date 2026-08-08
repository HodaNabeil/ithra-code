import type { Currency, RefundStatus } from '@/generated/prisma/enums';

export type RefundEntity = {
  id: string;
  paymentId: string;
  amountCents: number;
  currency: Currency;
  reason: string | null;
  status: RefundStatus;
  providerRefundId: string | null;
  createdAt: Date;
  updatedAt: Date;
  processedAt: Date | null;
};

export const TERMINAL_REFUND_STATUSES: readonly RefundStatus[] = [
  'SUCCEEDED',
  'FAILED',
] as const;

export function isTerminalRefundStatus(status: RefundStatus): boolean {
  return TERMINAL_REFUND_STATUSES.includes(status);
}

export function isSuccessfulRefund(
  refund: Pick<RefundEntity, 'status'>,
): boolean {
  return refund.status === 'SUCCEEDED';
}
