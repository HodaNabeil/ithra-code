import { logger } from '@/lib/logger';
import type { ReconciliationDecision } from '@/features/payments/domain/reconciliation-decision';
import type { ProviderPaymentStatus } from '../providers/payment-provider.gateway';
import type {
  DuePaymentRecord,
  MetricsRecorder,
  OrderCompletedPublisher,
  PaymentRepository,
  RecordReconcileAttemptInput,
  UnitOfWork,
} from '../ports';
import type { FulfillOrderService } from './fulfill-order.service';
import type { OrderCompletedEvent } from '../events/order-completed.event';
import type { PaymentReconcileStatus } from '@/generated/prisma/enums';

export type ReconciliationApplyInput = {
  record: DuePaymentRecord;
  providerStatus: ProviderPaymentStatus;
  decision: ReconciliationDecision;
  correlationId: string;
  latencyMs: number;
  consecutiveNotFoundCount: number;
  nextAttempt: number;
};

export type ReconciliationApplySummaryKey =
  | 'fulfilled'
  | 'failed'
  | 'deferred'
  | 'abandoned'
  | 'manualReview'
  | 'skipped';

export type ReconciliationApplyResult = {
  summaryKey: ReconciliationApplySummaryKey;
  completedEvent: OrderCompletedEvent | null;
};

export type ReconciliationCoordinatorDeps = {
  unitOfWork: UnitOfWork;
  paymentRepository: PaymentRepository;
  fulfillOrderService: FulfillOrderService;
  orderCompletedPublisher?: OrderCompletedPublisher;
  metrics?: MetricsRecorder;
};

/**
 * Applies a reconciliation decision: fulfill, defer, escalate, or abandon.
 * Fulfillment and reconcile audit share one transaction for money paths.
 */
export class ReconciliationCoordinator {
  constructor(private readonly deps: ReconciliationCoordinatorDeps) {}

  async apply(input: ReconciliationApplyInput): Promise<ReconciliationApplyResult> {
    const { record, providerStatus, decision } = input;

    if (decision.type === 'fulfill_success') {
      const fulfillResult = await this.deps.unitOfWork.execute(async (repos) => {
        const result = await this.deps.fulfillOrderService.fulfillWithRepositories(
          repos,
          {
            orderId: record.orderId,
            outcome: 'succeeded',
            providerTransactionId: providerStatus.providerTransactionId,
            providerMetadata: providerStatus.providerMetadata,
            paymentMethod: providerStatus.paymentMethod,
            last4: providerStatus.last4,
            brand: providerStatus.brand,
            integrationId: providerStatus.integrationId,
          },
        );

        await repos.payments.recordReconcileAttempt(
          this.buildAttemptPayload(input, {
            outcome: providerStatus.outcome,
            decision: decision.type,
            detail: providerStatus.detail ?? null,
            consecutiveNotFoundCount: 0,
            reconcileStatus: 'IDLE',
            nextReconcileAt: null,
            lastProviderOutcome: providerStatus.outcome,
            lastProviderDetail: providerStatus.detail ?? null,
          }),
        );

        return result;
      });

      if (
        fulfillResult.completedEvent &&
        this.deps.orderCompletedPublisher
      ) {
        try {
          await this.deps.orderCompletedPublisher.publish(
            fulfillResult.completedEvent,
          );
        } catch (publishError) {
          logger.error(
            { error: publishError, orderId: record.orderId },
            '[ORDER_COMPLETED_PUBLISH_FAILED]',
          );
        }
      }

      this.metric('payment_reconcile_fulfilled', providerStatus.outcome);

      return {
        summaryKey: fulfillResult.fulfilled ? 'fulfilled' : 'skipped',
        completedEvent: fulfillResult.completedEvent,
      };
    }

    if (decision.type === 'fulfill_failure' || decision.type === 'abandon') {
      await this.deps.unitOfWork.execute(async (repos) => {
        await this.deps.fulfillOrderService.fulfillWithRepositories(repos, {
          orderId: record.orderId,
          outcome: 'failed',
          providerTransactionId: providerStatus.providerTransactionId,
          providerMetadata: providerStatus.providerMetadata,
          failureCode: decision.failureCode,
          failureMessage: decision.failureMessage,
        });

        await repos.payments.recordReconcileAttempt(
          this.buildAttemptPayload(input, {
            outcome: providerStatus.outcome,
            decision: decision.type,
            detail: decision.failureMessage,
            consecutiveNotFoundCount: input.consecutiveNotFoundCount,
            reconcileStatus: 'IDLE',
            nextReconcileAt: null,
            lastProviderOutcome: providerStatus.outcome,
            lastProviderDetail: decision.failureMessage,
          }),
        );
      });

      this.metric(
        decision.type === 'abandon'
          ? 'payment_reconcile_abandoned'
          : 'payment_reconcile_failed',
        providerStatus.outcome,
      );

      return {
        summaryKey: decision.type === 'abandon' ? 'abandoned' : 'failed',
        completedEvent: null,
      };
    }

    if (decision.type === 'defer') {
      await this.recordAttempt(input, {
        outcome: providerStatus.outcome,
        decision: decision.type,
        detail: decision.reason,
        consecutiveNotFoundCount: input.consecutiveNotFoundCount,
        reconcileStatus: 'SCHEDULED',
        nextReconcileAt: decision.nextRetryAt,
        lastProviderOutcome: providerStatus.outcome,
        lastProviderDetail: providerStatus.detail ?? decision.reason,
      });

      this.metric('payment_reconcile_deferred', providerStatus.outcome);

      return { summaryKey: 'deferred', completedEvent: null };
    }

    await this.recordAttempt(input, {
      outcome: providerStatus.outcome,
      decision: decision.type,
      detail: decision.reason,
      consecutiveNotFoundCount: input.consecutiveNotFoundCount,
      reconcileStatus: 'MANUAL_REVIEW',
      nextReconcileAt: null,
      lastProviderOutcome: providerStatus.outcome,
      lastProviderDetail: decision.reason,
    });

    this.metric('payment_reconcile_manual_review', providerStatus.outcome);

    return { summaryKey: 'manualReview', completedEvent: null };
  }

  async recordErrorDefer(input: {
    record: DuePaymentRecord;
    correlationId: string;
    latencyMs: number;
    nextRetryAt: Date;
    detail: string;
  }): Promise<void> {
    const nextAttempt = input.record.payment.reconcileAttemptCount + 1;

    await this.deps.paymentRepository.recordReconcileAttempt({
      paymentId: input.record.payment.id,
      attempt: nextAttempt,
      outcome: 'transient_error',
      decision: 'defer',
      detail: input.detail,
      latencyMs: input.latencyMs,
      correlationId: input.correlationId,
      consecutiveNotFoundCount: input.record.payment.consecutiveNotFoundCount,
      reconcileStatus: 'SCHEDULED',
      nextReconcileAt: input.nextRetryAt,
      lastProviderOutcome: 'transient_error',
      lastProviderDetail: input.detail,
    });

    this.metric('payment_reconcile_error', 'transient_error');
  }

  private buildAttemptPayload(
    input: ReconciliationApplyInput,
    fields: {
      outcome: string;
      decision: string;
      detail: string | null;
      consecutiveNotFoundCount: number;
      reconcileStatus: PaymentReconcileStatus;
      nextReconcileAt: Date | null;
      lastProviderOutcome: string;
      lastProviderDetail: string | null;
    },
  ): RecordReconcileAttemptInput {
    return {
      paymentId: input.record.payment.id,
      attempt: input.nextAttempt,
      correlationId: input.correlationId,
      latencyMs: input.latencyMs,
      httpStatus: input.providerStatus.httpStatus,
      ...fields,
    };
  }

  private async recordAttempt(
    input: ReconciliationApplyInput,
    fields: {
      outcome: string;
      decision: string;
      detail: string | null;
      consecutiveNotFoundCount: number;
      reconcileStatus: PaymentReconcileStatus;
      nextReconcileAt: Date | null;
      lastProviderOutcome: string;
      lastProviderDetail: string | null;
    },
  ): Promise<void> {
    const payload = this.buildAttemptPayload(input, fields);

    await this.deps.paymentRepository.recordReconcileAttempt(payload);

    this.deps.metrics?.observeHistogram(
      'payment_reconcile_latency_ms',
      input.latencyMs,
      { outcome: fields.outcome, decision: fields.decision },
    );
  }

  private metric(name: string, outcome: string): void {
    this.deps.metrics?.incrementCounter(name, { outcome });
  }
}
