import { metrics } from '@opentelemetry/api';

type CounterMap = Map<string, ReturnType<ReturnType<typeof metrics.getMeter>['createCounter']>>;
type HistogramMap = Map<string, ReturnType<ReturnType<typeof metrics.getMeter>['createHistogram']>>;

const meter = metrics.getMeter('ithracode-ai-platform');
const counters: CounterMap = new Map();
const histograms: HistogramMap = new Map();

const legacyCounters = new Map<string, number>();
const legacyHistograms = new Map<string, number[]>();

function getCounter(name: string, description: string) {
  if (!counters.has(name)) {
    counters.set(
      name,
      meter.createCounter(name, { description }),
    );
  }
  return counters.get(name)!;
}

function getHistogram(name: string, description: string) {
  if (!histograms.has(name)) {
    histograms.set(
      name,
      meter.createHistogram(name, { description }),
    );
  }
  return histograms.get(name)!;
}

function labelKey(labels: Record<string, string>): string {
  return Object.entries(labels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join(',');
}

export const platformMetrics = {
  incrementAgentRun(agentId: string, status: string): void {
    const labels = { agent_id: agentId, status };
    getCounter('ai_agent_runs_total', 'Total agent runs').add(1, labels);
    const key = `ai_agent_runs_total|${labelKey(labels)}`;
    legacyCounters.set(key, (legacyCounters.get(key) ?? 0) + 1);
  },

  recordAgentDuration(agentId: string, durationMs: number): void {
    const labels = { agent_id: agentId };
    getHistogram('ai_agent_run_duration_ms', 'Agent run duration').record(durationMs, labels);
    const key = `ai_agent_run_duration_ms|${labelKey(labels)}`;
    const bucket = legacyHistograms.get(key) ?? [];
    bucket.push(durationMs);
    legacyHistograms.set(key, bucket);
  },

  incrementLlmTokens(model: string, direction: 'input' | 'output', count: number): void {
    const labels = { model, direction };
    getCounter('ai_llm_tokens_total', 'LLM token usage').add(count, labels);
    const key = `ai_llm_tokens_total|${labelKey(labels)}`;
    legacyCounters.set(key, (legacyCounters.get(key) ?? 0) + count);
  },

  incrementToolInvocation(toolId: string, status: string): void {
    const labels = { tool_id: toolId, status };
    getCounter('ai_tool_invocations_total', 'Tool invocations').add(1, labels);
    const key = `ai_tool_invocations_total|${labelKey(labels)}`;
    legacyCounters.set(key, (legacyCounters.get(key) ?? 0) + 1);
  },

  incrementRetrieval(agentId: string, chunkCount: number): void {
    const labels = { agent_id: agentId };
    getCounter('ai_retrieval_chunks_total', 'Retrieved chunks').add(chunkCount, labels);
    const key = `ai_retrieval_chunks_total|${labelKey(labels)}`;
    legacyCounters.set(key, (legacyCounters.get(key) ?? 0) + chunkCount);
  },

  recordRetrievalLatency(agentId: string, durationMs: number): void {
    const labels = { agent_id: agentId };
    getHistogram('ai_retrieval_latency_ms', 'Retrieval latency').record(durationMs, labels);
  },

  toPrometheusText(): string {
    const lines: string[] = [];

    for (const [key, value] of legacyCounters.entries()) {
      const [name, labelPart] = key.split('|');
      const labels = labelPart
        ? `{${labelPart
            .split(',')
            .map((pair) => {
              const [k, v] = pair.split('=');
              return `${k}="${v}"`;
            })
            .join(',')}}`
        : '';
      lines.push(`# TYPE ${name} counter`);
      lines.push(`${name}${labels} ${value}`);
    }

    for (const [key, values] of legacyHistograms.entries()) {
      const [name, labelPart] = key.split('|');
      const labels = labelPart
        ? `{${labelPart
            .split(',')
            .map((pair) => {
              const [k, v] = pair.split('=');
              return `${k}="${v}"`;
            })
            .join(',')}}`
        : '';
      const sum = values.reduce((acc, value) => acc + value, 0);
      lines.push(`# TYPE ${name} summary`);
      lines.push(`${name}_count${labels} ${values.length}`);
      lines.push(`${name}_sum${labels} ${sum}`);
    }

    return lines.join('\n');
  },
};
