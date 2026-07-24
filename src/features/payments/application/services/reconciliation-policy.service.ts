import type { ProviderPaymentOutcome } from '../providers/payment-provider.gateway';
import type { ReconciliationDecision } from '@/features/payments/domain/reconciliation-decision';

export type ReconciliationPolicyConfig = {
  maxAttempts: number;
  maxWindowMs: number;
  backoffBaseMs: number;
  backoffCapMs: number;
  abandonNotFoundCount: number;
};

export type ReconciliationPolicyContext = {
  outcome: ProviderPaymentOutcome;
  /** 0-based count of completed reconcile attempts before this one. */
  attemptCount: number;
  consecutiveNotFoundCount: number;
  paymentCreatedAt: Date;
  sessionExpiresAt: Date | null;
  now: Date;
  failureCode?: string | null;
  failureMessage?: string | null;
};

/**
 * Gateway-agnostic reconcile policy.
 * Maps provider outcomes + timing → fulfill / defer / review / abandon.
 */
export class ReconciliationPolicy {
  constructor(private readonly config: ReconciliationPolicyConfig) {}

  decide(ctx: ReconciliationPolicyContext): ReconciliationDecision {
    if (ctx.outcome === 'succeeded') {
      return { type: 'fulfill_success' };
    }

    if (ctx.outcome === 'failed') {
      return {
        type: 'fulfill_failure',
        failureCode: ctx.failureCode ?? 'PROVIDER_FAILED',
        failureMessage: ctx.failureMessage ?? 'Payment failed at provider',
      };
    }

    if (ctx.outcome === 'ambiguous') {
      if (ctx.attemptCount < 2) {
        return {
          type: 'defer',
          nextRetryAt: this.computeNextRetryAt(ctx.attemptCount, ctx.now),
          reason:
            ctx.failureMessage ??
            'Ambiguous provider response — short retry before manual review',
        };
      }

      return {
        type: 'manual_review',
        reason: ctx.failureMessage ?? 'Ambiguous provider response',
      };
    }

    // pending | not_found | transient_error
    const ageMs = ctx.now.getTime() - ctx.paymentCreatedAt.getTime();
    const nextAttemptNumber = ctx.attemptCount + 1;
    const exhausted =
      nextAttemptNumber >= this.config.maxAttempts ||
      ageMs >= this.config.maxWindowMs;

    const sessionExpired =
      ctx.sessionExpiresAt != null && ctx.sessionExpiresAt.getTime() <= ctx.now.getTime();

    const consecutiveNotFound =
      ctx.outcome === 'not_found'
        ? ctx.consecutiveNotFoundCount + 1
        : ctx.consecutiveNotFoundCount;

    if (exhausted) {
      if (
        consecutiveNotFound >= this.config.abandonNotFoundCount &&
        (sessionExpired || ctx.sessionExpiresAt == null)
      ) {
        return {
          type: 'abandon',
          failureCode: 'PAYMENT_ABANDONED',
          failureMessage:
            ctx.failureMessage ??
            'No provider transaction found after reconcile window',
        };
      }

      return {
        type: 'manual_review',
        reason: `Reconcile exhausted after ${nextAttemptNumber} attempts (outcome=${ctx.outcome})`,
      };
    }

    return {
      type: 'defer',
      nextRetryAt: this.computeNextRetryAt(ctx.attemptCount, ctx.now),
      reason: `Inconclusive outcome=${ctx.outcome}; scheduling retry`,
    };
  }

  /** delay = min(cap, base * 2^attempt) ± 10% jitter */
  computeNextRetryAt(completedAttempts: number, now: Date): Date {
    const exp = Math.min(
      this.config.backoffCapMs,
      this.config.backoffBaseMs * 2 ** Math.max(0, completedAttempts),
    );
    const jitter = exp * 0.1 * (Math.random() * 2 - 1);
    return new Date(now.getTime() + Math.max(60_000, Math.round(exp + jitter)));
  }
}
