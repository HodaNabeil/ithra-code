import { randomUUID } from 'node:crypto';
import { logger } from '@/lib/logger';
import type { PaymentInquiryRegistry } from '../ports/payment-inquiry.port';
import type {
  DuePaymentRecord,
  MetricsRecorder,
  PaymentRepository,
} from '../ports';
import {
  ReconciliationPolicy,
  type ReconciliationPolicyConfig,
} from '../services/reconciliation-policy.service';
import { ReconciliationCoordinator } from '../services/reconciliation-coordinator.service';
import { normalizeProviderOutcomeForReconcile } from '../services/reconciliation-provider-outcome.validator';
import type { ProviderRateLimiter } from '../ports/provider-rate-limiter';
import type { ReconcilePaymentsPublisher } from '../ports/reconcile-payments.publisher';
import type { ReconciliationApplySummaryKey } from '../services/reconciliation-coordinator.service';

export type ReconcilePaymentsConfig = ReconciliationPolicyConfig & {
  thresholdMinutes: number;
  batchSize: number;
  useQueue: boolean;
};

export type ReconcilePaymentsSummary = {
  scanned: number;
  enqueued: number;
  fulfilled: number;
  failed: number;
  deferred: number;
  abandoned: number;
  manualReview: number;
  skipped: number;
  errors: number;
};

export type ReconcilePaymentsUseCaseDeps = {
  paymentRepository: PaymentRepository;
  inquiryRegistry: PaymentInquiryRegistry;
  reconciliationPolicy: ReconciliationPolicy;
  coordinator: ReconciliationCoordinator;
  reconcilePublisher?: ReconcilePaymentsPublisher;
  rateLimiter?: ProviderRateLimiter;
  metrics?: MetricsRecorder;
  config: ReconcilePaymentsConfig;
};

/**
 * Polls due non-terminal payments and reconciles them against provider status.
 * Idempotent via FulfillOrderService; scheduling via ReconciliationPolicy.
 */
export class ReconcilePaymentsUseCase {
  constructor(private readonly deps: ReconcilePaymentsUseCaseDeps) {}

  async execute(): Promise<ReconcilePaymentsSummary> {
    const summary = this.emptySummary();

    const olderThan = new Date(
      Date.now() - this.deps.config.thresholdMinutes * 60 * 1000,
    );

    const dueRecords =
      await this.deps.paymentRepository.claimDueForReconciliation({
        statuses: ['PENDING', 'PROCESSING'],
        olderThan,
        limit: this.deps.config.batchSize,
      });

    summary.scanned = dueRecords.length;

    if (this.deps.config.useQueue && this.deps.reconcilePublisher) {
      await this.deps.reconcilePublisher.enqueueBatch(
        dueRecords.map((record) => ({
          paymentId: record.payment.id,
          correlationId: randomUUID(),
        })),
      );
      summary.enqueued = dueRecords.length;
      logger.info(summary, '[PAYMENT_RECONCILE_BATCH_ENQUEUED]');
      return summary;
    }

    for (const record of dueRecords) {
      await this.processRecord(record, randomUUID(), summary);
    }

    logger.info(summary, '[PAYMENT_RECONCILE_BATCH_COMPLETE]');
    return summary;
  }

  async processPayment(
    paymentId: string,
    correlationId: string,
  ): Promise<void> {
    const record =
      await this.deps.paymentRepository.findReconciliationContext(paymentId);

    if (!record) {
      logger.warn({ paymentId }, '[PAYMENT_RECONCILE_CONTEXT_MISSING]');
      return;
    }

    const summary = this.emptySummary();
    summary.scanned = 1;
    await this.processRecord(record, correlationId, summary);
  }

  private async processRecord(
    record: DuePaymentRecord,
    correlationId: string,
    summary: ReconcilePaymentsSummary,
  ): Promise<void> {
    const inquiry = this.deps.inquiryRegistry[record.payment.provider];

    if (!inquiry) {
      summary.skipped += 1;
      logger.warn(
        {
          paymentId: record.payment.id,
          orderId: record.orderId,
          provider: record.payment.provider,
          correlationId,
        },
        '[PAYMENT_RECONCILE_NO_INQUIRY_PORT]',
      );
      return;
    }

    const startedAt = Date.now();

    try {
      if (this.deps.rateLimiter) {
        await this.deps.rateLimiter.acquire(record.payment.provider);
      }

      const rawStatus = await inquiry.inquire({
        orderId: record.orderId,
        providerTransactionId: record.payment.providerTransactionId,
        providerSessionId: record.providerSessionId,
      });

      const providerStatus = normalizeProviderOutcomeForReconcile(
        rawStatus,
        record.payment,
      );

      const decision = this.deps.reconciliationPolicy.decide({
        outcome: providerStatus.outcome,
        attemptCount: record.payment.reconcileAttemptCount,
        consecutiveNotFoundCount: record.payment.consecutiveNotFoundCount,
        paymentCreatedAt: record.payment.createdAt,
        sessionExpiresAt: record.sessionExpiresAt,
        now: new Date(),
        failureCode: providerStatus.failureCode,
        failureMessage: providerStatus.failureMessage ?? providerStatus.detail,
      });

      const nextAttempt = record.payment.reconcileAttemptCount + 1;
      const consecutiveNotFound =
        providerStatus.outcome === 'not_found'
          ? record.payment.consecutiveNotFoundCount + 1
          : 0;

      const latencyMs = Date.now() - startedAt;

      const applyResult = await this.deps.coordinator.apply({
        record,
        providerStatus,
        decision,
        correlationId,
        latencyMs,
        consecutiveNotFoundCount: consecutiveNotFound,
        nextAttempt,
      });

      this.incrementSummary(summary, applyResult.summaryKey);

      logger.info(
        {
          orderId: record.orderId,
          paymentId: record.payment.id,
          providerOutcome: providerStatus.outcome,
          decision: decision.type,
          attempt: nextAttempt,
          correlationId,
        },
        '[PAYMENT_RECONCILE_PROCESSED]',
      );
    } catch (error) {
      summary.errors += 1;
      const latencyMs = Date.now() - startedAt;
      const detail =
        error instanceof Error ? error.message : 'Unknown reconcile error';
      const nextRetryAt = this.deps.reconciliationPolicy.computeNextRetryAt(
        record.payment.reconcileAttemptCount,
        new Date(),
      );

      await this.deps.coordinator.recordErrorDefer({
        record,
        correlationId,
        latencyMs,
        nextRetryAt,
        detail,
      });

      logger.error(
        {
          error,
          orderId: record.orderId,
          paymentId: record.payment.id,
          correlationId,
        },
        '[PAYMENT_RECONCILE_ERROR]',
      );
    }
  }

  private incrementSummary(
    summary: ReconcilePaymentsSummary,
    key: ReconciliationApplySummaryKey,
  ): void {
    switch (key) {
      case 'fulfilled':
        summary.fulfilled += 1;
        break;
      case 'failed':
        summary.failed += 1;
        break;
      case 'deferred':
        summary.deferred += 1;
        break;
      case 'abandoned':
        summary.abandoned += 1;
        break;
      case 'manualReview':
        summary.manualReview += 1;
        break;
      case 'skipped':
        summary.skipped += 1;
        break;
      default:
        break;
    }
  }

  private emptySummary(): ReconcilePaymentsSummary {
    return {
      scanned: 0,
      enqueued: 0,
      fulfilled: 0,
      failed: 0,
      deferred: 0,
      abandoned: 0,
      manualReview: 0,
      skipped: 0,
      errors: 0,
    };
  }
}
