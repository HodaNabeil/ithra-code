import { describe, expect, it, vi } from 'vitest';

import {
  listAllowedMetricLabelKeys,
  sanitizeMetricLabels,
} from '@/ai-platform/observability/metrics/metric-labels';
import { platformMetrics } from '@/ai-platform/observability/metrics/platform-metrics';
import {
  runTelemetrySafely,
  runTelemetrySafelyAsync,
} from '@/ai-platform/observability/opentelemetry/telemetry-isolation';
import {
  markOtelInitialized,
  resetOtelInitializedForTests,
  withSpan,
} from '@/ai-platform/observability/opentelemetry/span-helpers';

describe('telemetry-isolation', () => {
  it('returns fallback when synchronous telemetry throws', () => {
    const result = runTelemetrySafely(
      'test',
      () => {
        throw new Error('otel exporter down');
      },
      'fallback',
    );

    expect(result).toBe('fallback');
  });

  it('returns fallback when async telemetry throws', async () => {
    const result = await runTelemetrySafelyAsync(
      'test',
      async () => {
        throw new Error('otel exporter down');
      },
      async () => 'fallback',
    );

    expect(result).toBe('fallback');
  });

  it('withSpan still resolves when OTEL is inactive', async () => {
    resetOtelInitializedForTests();

    const result = await withSpan('ai.test.span', {}, async () => 'ok');
    expect(result).toBe('ok');
  });

  it('withSpan returns fallback result when active span creation throws', async () => {
    markOtelInitialized();

    const traceModule = await import('@opentelemetry/api');
    const noopSpan = {
      end: vi.fn(),
      setAttribute: vi.fn(),
      setStatus: vi.fn(),
      recordException: vi.fn(),
    };
    const getTracerSpy = vi
      .spyOn(traceModule.trace, 'getTracer')
      .mockImplementation((name) => {
        if (name === 'noop') {
          return {
            startSpan: () => noopSpan,
          } as never;
        }

        return {
          startActiveSpan: () => {
            throw new Error('span creation failed');
          },
        } as never;
      });

    const result = await withSpan(
      'ai.test.span',
      {},
      async () => 'business-result',
    );

    expect(result).toBe('business-result');
    getTracerSpy.mockRestore();
    resetOtelInitializedForTests();
  });
});

describe('metric-labels', () => {
  it('drops forbidden high-cardinality labels', () => {
    const labels = sanitizeMetricLabels('ai_requests_total', {
      agent_id: 'tutor',
      status: 'completed',
      user_id: 'user-123',
      course_id: 'course-abc',
    });

    expect(labels).toEqual({
      agent_id: 'tutor',
      status: 'completed',
    });
  });

  it('filters unknown labels per metric allowlist', () => {
    const labels = sanitizeMetricLabels('ai_request_errors_total', {
      agent_id: 'tutor',
      error_code: 'RATE_LIMITED',
      model: 'gpt-4o-mini',
    });

    expect(labels).toEqual({
      agent_id: 'tutor',
      error_code: 'RATE_LIMITED',
    });
  });

  it('documents allowed keys for core metrics', () => {
    expect(listAllowedMetricLabelKeys('ai_cost_usd_total')).toEqual([
      'model',
      'provider',
      'agent_id',
    ]);
  });
});

describe('platform-metrics isolation', () => {
  it('does not throw when counter export fails', () => {
    expect(() =>
      platformMetrics.incrementRequestError('tutor', 'RUNTIME_ERROR'),
    ).not.toThrow();

    expect(() =>
      platformMetrics.recordRunOutcome({
        agentId: 'tutor',
        model: 'gpt-4o-mini',
        provider: 'openai',
        embeddingModel: 'text-embedding-3-small',
        durationMs: 100,
        inputTokens: 10,
        outputTokens: 5,
        embeddingTokens: 2,
        costUsd: 0.001,
      }),
    ).not.toThrow();
  });
});
