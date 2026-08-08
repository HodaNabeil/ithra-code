export type MetricLabels = Record<string, string | number | boolean>;

export interface MetricsRecorder {
  incrementCounter(name: string, labels?: MetricLabels): void;
  observeHistogram(
    name: string,
    valueMs: number,
    labels?: MetricLabels,
  ): void;
}
