import type { PaymentEntity } from '@/features/payments/domain';
import type { PaymentReconcileStatus, PaymentStatus } from '@/generated/prisma/enums';

export type DuePaymentRecord = {
  payment: PaymentEntity;
  orderId: string;
  providerSessionId: string | null;
  sessionExpiresAt: Date | null;
};

/** @deprecated Prefer DuePaymentRecord — kept for gradual migration. */
export type StalePaymentRecord = DuePaymentRecord;

export type ClaimDuePaymentsInput = {
  statuses: readonly PaymentStatus[];
  /** Fallback for rows with null nextReconcileAt (legacy). */
  olderThan: Date;
  limit: number;
  /** Short lease so another worker does not reclaim mid-flight. */
  claimLeaseMs?: number;
};

export type FindStalePaymentsInput = ClaimDuePaymentsInput;

export type MarkPaymentSucceededInput = {
  paymentId: string;
  providerTransactionId: string;
  providerMetadata?: unknown;
  paymentMethod?: string | null;
  last4?: string | null;
  brand?: string | null;
  integrationId?: number | null;
};

export type MarkPaymentFailedInput = {
  paymentId: string;
  providerTransactionId?: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  providerMetadata?: unknown;
};

export type SchedulePaymentReconcileInput = {
  paymentId: string;
  nextReconcileAt: Date;
  reconcileStatus?: PaymentReconcileStatus;
};

export type RecordReconcileAttemptInput = {
  paymentId: string;
  attempt: number;
  outcome: string;
  decision: string;
  httpStatus?: number | null;
  detail?: string | null;
  latencyMs?: number | null;
  correlationId?: string | null;
  consecutiveNotFoundCount: number;
  reconcileStatus: PaymentReconcileStatus;
  nextReconcileAt: Date | null;
  lastProviderOutcome: string;
  lastProviderDetail: string | null;
};

/**
 * Persistence port for the Payment aggregate.
 * Owned by the Application layer; implemented in Infrastructure.
 */
export interface PaymentRepository {
  save(payment: PaymentEntity): Promise<PaymentEntity>;

  findById(paymentId: string): Promise<PaymentEntity | null>;

  /** Moves a payment to PROCESSING after a provider session was created. */
  markProcessing(paymentId: string): Promise<void>;

  /**
   * Marks processing and schedules the first reconcile after `firstReconcileAt`.
   */
  markProcessingAndScheduleReconcile(
    paymentId: string,
    firstReconcileAt: Date,
  ): Promise<void>;

  /**
   * Marks payment SUCCEEDED only from PENDING/PROCESSING.
   * @returns true when a row was updated, false when already terminal (idempotent no-op).
   */
  markSucceeded(input: MarkPaymentSucceededInput): Promise<boolean>;

  /**
   * Marks payment FAILED only from PENDING/PROCESSING.
   * @returns true when a row was updated, false when already terminal (idempotent no-op).
   */
  markFailed(input: MarkPaymentFailedInput): Promise<boolean>;

  /**
   * Claims due non-terminal payments for reconciliation (SKIP LOCKED).
   * @deprecated Prefer claimDueForReconciliation.
   */
  findStaleForReconciliation(
    input: FindStalePaymentsInput,
  ): Promise<DuePaymentRecord[]>;

  claimDueForReconciliation(
    input: ClaimDuePaymentsInput,
  ): Promise<DuePaymentRecord[]>;

  findReconciliationContext(
    paymentId: string,
  ): Promise<DuePaymentRecord | null>;

  recordReconcileAttempt(input: RecordReconcileAttemptInput): Promise<void>;

  scheduleReconcile(input: SchedulePaymentReconcileInput): Promise<void>;
}
