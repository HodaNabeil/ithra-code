/**
 * Domain value object: what reconciliation should do after a provider inquiry.
 * Independent of any concrete gateway (Paymob, Stripe, …).
 */
export type ReconciliationDecisionType =
  | 'fulfill_success'
  | 'fulfill_failure'
  | 'defer'
  | 'manual_review'
  | 'abandon';

export type ReconciliationDecision =
  | { type: 'fulfill_success' }
  | {
      type: 'fulfill_failure';
      failureCode: string;
      failureMessage: string;
    }
  | {
      type: 'defer';
      nextRetryAt: Date;
      reason: string;
    }
  | {
      type: 'manual_review';
      reason: string;
    }
  | {
      type: 'abandon';
      failureCode: string;
      failureMessage: string;
    };
