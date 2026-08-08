export type ReconcilePaymentJob = {
  paymentId: string;
  correlationId: string;
};

export interface ReconcilePaymentsPublisher {
  enqueue(job: ReconcilePaymentJob): Promise<void>;
  enqueueBatch(jobs: ReconcilePaymentJob[]): Promise<void>;
}
