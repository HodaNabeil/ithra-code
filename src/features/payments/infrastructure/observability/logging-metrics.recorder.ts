import { logger } from '@/lib/logger';
import type {
  MetricLabels,
  MetricsRecorder,
} from '@/features/payments/application/ports/metrics.recorder';

/**
 * Structured-log metrics adapter. Swap for Prometheus/OTEL in production.
 */
export class LoggingMetricsRecorder implements MetricsRecorder {
  incrementCounter(name: string, labels?: MetricLabels): void {
    logger.info({ metric: name, labels }, '[PAYMENT_METRIC_COUNTER]');
  }

  observeHistogram(
    name: string,
    valueMs: number,
    labels?: MetricLabels,
  ): void {
    logger.info(
      { metric: name, valueMs, labels },
      '[PAYMENT_METRIC_HISTOGRAM]',
    );
  }
}

export const loggingMetricsRecorder = new LoggingMetricsRecorder();
