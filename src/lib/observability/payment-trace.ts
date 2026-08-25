import { AsyncLocalStorage } from 'node:async_hooks';

export type PaymentTraceContext = {
  traceId: string;
  correlationId?: string;
  orderId?: string;
  paymentId?: string;
  userId?: string;
};

const storage = new AsyncLocalStorage<PaymentTraceContext>();

export function runWithPaymentTrace<T>(
  context: PaymentTraceContext,
  fn: () => T,
): T {
  return storage.run(context, fn);
}

export function getPaymentTrace(): PaymentTraceContext | undefined {
  return storage.getStore();
}

export function mergePaymentTrace(partial: Partial<PaymentTraceContext>): void {
  const current = storage.getStore();
  if (!current) {
    return;
  }

  Object.assign(current, partial);
}
