import type { MetricLabels, MetricsRecorder } from '@/features/payments/application/ports/metrics.recorder';

type CounterKey = string;
type HistogramSample = { valueMs: number; labels?: MetricLabels };

/**
 * In-memory metrics recorder compatible with Prometheus text exposition.
 */
export class PrometheusMetricsRecorder implements MetricsRecorder {
  private readonly counters = new Map<CounterKey, number>();
  private readonly histograms = new Map<string, HistogramSample[]>();

  incrementCounter(name: string, labels?: MetricLabels): void {
    const key = this.counterKey(name, labels);
    this.counters.set(key, (this.counters.get(key) ?? 0) + 1);
  }

  observeHistogram(
    name: string,
    valueMs: number,
    labels?: MetricLabels,
  ): void {
    const samples = this.histograms.get(name) ?? [];
    samples.push({ valueMs, labels });
    this.histograms.set(name, samples);
  }

  toPrometheusText(): string {
    const lines: string[] = [];

    for (const [key, value] of this.counters.entries()) {
      const { name, labelText } = this.parseCounterKey(key);
      lines.push(
        `# TYPE ${name} counter`,
        `${name}${labelText} ${value}`,
      );
    }

    for (const [name, samples] of this.histograms.entries()) {
      if (samples.length === 0) continue;
      const sum = samples.reduce((acc, sample) => acc + sample.valueMs, 0);
      lines.push(
        `# TYPE ${name} summary`,
        `${name}_count ${samples.length}`,
        `${name}_sum ${sum}`,
      );
    }

    return lines.join('\n');
  }

  private counterKey(name: string, labels?: MetricLabels): CounterKey {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }

    const labelText = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}="${String(value)}"`)
      .join(',');

    return `${name}{${labelText}}`;
  }

  private parseCounterKey(key: CounterKey): {
    name: string;
    labelText: string;
  } {
    const braceIndex = key.indexOf('{');
    if (braceIndex === -1) {
      return { name: key, labelText: '' };
    }

    return {
      name: key.slice(0, braceIndex),
      labelText: key.slice(braceIndex),
    };
  }
}

export const prometheusMetricsRecorder = new PrometheusMetricsRecorder();
