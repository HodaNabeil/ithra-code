import { metrics } from '@opentelemetry/api';

import { sanitizeMetricLabels } from './metric-labels';
import { runTelemetrySafely } from '../opentelemetry/telemetry-isolation';

type CounterMap = Map<
  string,
  ReturnType<ReturnType<typeof metrics.getMeter>['createCounter']>
>;
type HistogramMap = Map<
  string,
  ReturnType<ReturnType<typeof metrics.getMeter>['createHistogram']>
>;

const meter = metrics.getMeter('ithracode-ai-platform');
const counters: CounterMap = new Map();
const histograms: HistogramMap = new Map();

function getCounter(name: string, description: string) {
  if (!counters.has(name)) {
    counters.set(name, meter.createCounter(name, { description }));
  }
  return counters.get(name)!;
}

function getHistogram(name: string, description: string) {
  if (!histograms.has(name)) {
    histograms.set(name, meter.createHistogram(name, { description }));
  }
  return histograms.get(name)!;
}

function recordCounter(
  metricName: string,
  description: string,
  value: number,
  labels: Record<string, string>,
): void {
  runTelemetrySafely(
    `metric:${metricName}`,
    () => {
      getCounter(metricName, description).add(
        value,
        sanitizeMetricLabels(metricName, labels),
      );
    },
    undefined,
  );
}

function recordHistogram(
  metricName: string,
  description: string,
  value: number,
  labels: Record<string, string>,
): void {
  runTelemetrySafely(
    `metric:${metricName}`,
    () => {
      getHistogram(metricName, description).record(
        value,
        sanitizeMetricLabels(metricName, labels),
      );
    },
    undefined,
  );
}

export type RunOutcomeMetricsInput = {
  agentId: string;
  model: string;
  provider: string;
  embeddingModel?: string;
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
  embeddingTokens: number;
  costUsd: number;
};

export const platformMetrics = {
  incrementAgentRun(agentId: string, status: string): void {
    const labels = { agent_id: agentId, status };
    recordCounter('ai_agent_runs_total', 'Total agent runs', 1, labels);
    recordCounter('ai_requests_total', 'Total AI agent requests', 1, labels);
  },

  recordAgentDuration(agentId: string, durationMs: number): void {
    const labels = { agent_id: agentId };
    recordHistogram(
      'ai_agent_run_duration_ms',
      'Agent run duration',
      durationMs,
      labels,
    );
    recordHistogram(
      'ai_request_duration_ms',
      'AI agent request duration',
      durationMs,
      labels,
    );
  },

  incrementLlmTokens(
    model: string,
    provider: string,
    direction: 'input' | 'output',
    count: number,
  ): void {
    if (count <= 0) {
      return;
    }

    recordCounter('ai_llm_tokens_total', 'LLM token usage', count, {
      model,
      provider,
      direction,
    });

    if (direction === 'input') {
      recordCounter('ai_tokens_input_total', 'LLM input tokens', count, {
        model,
        provider,
      });
      return;
    }

    recordCounter('ai_tokens_output_total', 'LLM output tokens', count, {
      model,
      provider,
    });
  },

  incrementEmbeddingTokens(model: string, count: number): void {
    if (count <= 0) {
      return;
    }

    recordCounter('ai_embedding_tokens_total', 'Embedding token usage', count, {
      model,
    });
  },

  incrementCostUsd(
    model: string,
    provider: string,
    agentId: string,
    costUsd: number,
  ): void {
    if (costUsd <= 0) {
      return;
    }

    recordCounter(
      'ai_cost_usd_total',
      'Estimated AI run cost in USD',
      costUsd,
      {
        model,
        provider,
        agent_id: agentId,
      },
    );
  },

  incrementRequestError(agentId: string, errorCode: string): void {
    recordCounter('ai_request_errors_total', 'AI agent request errors', 1, {
      agent_id: agentId,
      error_code: errorCode,
    });
  },

  recordRunOutcome(input: RunOutcomeMetricsInput): void {
    this.incrementAgentRun(input.agentId, 'completed');
    this.recordAgentDuration(input.agentId, input.durationMs);
    this.incrementLlmTokens(
      input.model,
      input.provider,
      'input',
      input.inputTokens,
    );
    this.incrementLlmTokens(
      input.model,
      input.provider,
      'output',
      input.outputTokens,
    );

    if (input.embeddingModel && input.embeddingTokens > 0) {
      this.incrementEmbeddingTokens(
        input.embeddingModel,
        input.embeddingTokens,
      );
    }

    this.incrementCostUsd(
      input.model,
      input.provider,
      input.agentId,
      input.costUsd,
    );
  },

  incrementToolInvocation(toolId: string, status: string): void {
    recordCounter('ai_tool_invocations_total', 'Tool invocations', 1, {
      tool_id: toolId,
      status,
    });
  },

  incrementRetrieval(agentId: string, chunkCount: number): void {
    recordCounter('ai_retrieval_chunks_total', 'Retrieved chunks', chunkCount, {
      agent_id: agentId,
    });
  },

  recordRetrievalLatency(agentId: string, durationMs: number): void {
    const labels = { agent_id: agentId };
    recordHistogram(
      'ai_retrieval_latency_ms',
      'Retrieval latency',
      durationMs,
      labels,
    );
    recordHistogram(
      'ai_rag_retrieval_duration_ms',
      'RAG retrieval latency',
      durationMs,
      labels,
    );
  },

  incrementBudgetReservationRejected(reason: string): void {
    recordCounter(
      'ai_budget_reservation_rejected_total',
      'Budget reservation rejections',
      1,
      { reason },
    );
  },

  incrementRateLimitRejected(scope: string): void {
    recordCounter('ai_rate_limit_rejected_total', 'Rate limit rejections', 1, {
      scope,
    });
  },

  incrementAuthFailure(reason: string): void {
    recordCounter('ai_auth_failure_total', 'Authorization failures', 1, {
      reason,
    });
  },

  incrementStreamAbort(agentId: string): void {
    recordCounter('ai_stream_abort_total', 'Stream aborts', 1, {
      agent_id: agentId,
    });
  },

  incrementRedisGuardFailure(guard: string): void {
    recordCounter('ai_redis_guard_failure_total', 'Redis guard failures', 1, {
      guard,
    });
  },
};
