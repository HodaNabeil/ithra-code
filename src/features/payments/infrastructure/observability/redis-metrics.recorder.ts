import { redis } from '@/lib/redis';
import type { MetricLabels, MetricsRecorder } from '@/features/payments/application/ports/metrics.recorder';

const METRICS_PREFIX = 'payment:metrics:counter:';
const HISTOGRAM_PREFIX = 'payment:metrics:histogram:';

function formatLabels(labels?: MetricLabels): string {
  if (!labels || Object.keys(labels).length === 0) {
    return '';
  }

  return `{${Object.entries(labels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}="${String(value)}"`)
    .join(',')}}`;
}

function counterKey(name: string, labels?: MetricLabels): string {
  return `${METRICS_PREFIX}${name}${formatLabels(labels)}`;
}

/**
 * Redis-backed metrics recorder shared across app instances.
 */
export class RedisMetricsRecorder implements MetricsRecorder {
  incrementCounter(name: string, labels?: MetricLabels): void {
    void redis.incr(counterKey(name, labels)).catch(() => {
      // Metrics must never break payment flows.
    });
  }

  observeHistogram(
    name: string,
    valueMs: number,
    labels?: MetricLabels,
  ): void {
    const key = `${HISTOGRAM_PREFIX}${name}${formatLabels(labels)}`;
    void redis
      .multi()
      .incr(`${key}:count`)
      .incrbyfloat(`${key}:sum`, valueMs)
      .exec()
      .catch(() => {
        // Metrics must never break payment flows.
      });
  }

  async toPrometheusText(): Promise<string> {
    const lines: string[] = [];

    try {
      const counterKeys = await redis.keys(`${METRICS_PREFIX}*`);
      for (const key of counterKeys.sort()) {
        const value = await redis.get(key);
        if (value == null) continue;
        const metricName = key.slice(METRICS_PREFIX.length);
        const braceIndex = metricName.indexOf('{');
        const name =
          braceIndex === -1 ? metricName : metricName.slice(0, braceIndex);
        const labelText =
          braceIndex === -1 ? '' : metricName.slice(braceIndex);
        lines.push(`# TYPE ${name} counter`, `${name}${labelText} ${value}`);
      }

      const histogramKeys = await redis.keys(`${HISTOGRAM_PREFIX}*:count`);
      for (const countKey of histogramKeys.sort()) {
        const baseKey = countKey.slice(0, -':count'.length);
        const metricName = baseKey.slice(HISTOGRAM_PREFIX.length);
        const braceIndex = metricName.indexOf('{');
        const name =
          braceIndex === -1 ? metricName : metricName.slice(0, braceIndex);
        const labelText =
          braceIndex === -1 ? '' : metricName.slice(braceIndex);
        const [count, sum] = await redis.mget(`${baseKey}:count`, `${baseKey}:sum`);
        if (!count) continue;
        lines.push(
          `# TYPE ${name} summary`,
          `${name}_count${labelText} ${count}`,
          `${name}_sum${labelText} ${sum ?? 0}`,
        );
      }
    } catch {
      return '# redis metrics unavailable\n';
    }

    return lines.join('\n');
  }

  async getManualReviewAlert(): Promise<{
    active: boolean;
    count: number;
  }> {
    try {
      const keys = await redis.keys(
        `${METRICS_PREFIX}payment_reconcile_manual_review*`,
      );
      let total = 0;
      for (const key of keys) {
        const value = Number(await redis.get(key));
        if (Number.isFinite(value)) {
          total += value;
        }
      }
      return { active: total > 0, count: total };
    } catch {
      return { active: false, count: 0 };
    }
  }
}

export const redisMetricsRecorder = new RedisMetricsRecorder();
