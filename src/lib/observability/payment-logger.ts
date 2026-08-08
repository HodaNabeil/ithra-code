import { logger } from '@/lib/logger';
import { getPaymentTrace } from './payment-trace';

type LogFields = Record<string, unknown>;

function withTrace(fields: LogFields = {}): LogFields {
  const trace = getPaymentTrace();
  if (!trace) {
    return fields;
  }

  return {
    traceId: trace.traceId,
    correlationId: trace.correlationId,
    orderId: trace.orderId,
    paymentId: trace.paymentId,
    userId: trace.userId,
    ...fields,
  };
}

export const paymentLogger = {
  info(fields: LogFields, message: string): void {
    logger.info(withTrace(fields), message);
  },
  warn(fields: LogFields, message: string): void {
    logger.warn(withTrace(fields), message);
  },
  error(fields: LogFields, message: string): void {
    logger.error(withTrace(fields), message);
  },
};
