import { describe, expect, it } from 'vitest';

import {
  buildAiRunLogEvent,
  sanitizeAiLogEvent,
  type AiRunLogEvent,
} from '@/ai-platform/observability/logging/ai-event-logger';
import { runWithTraceContext } from '@/ai-platform/observability/langsmith/trace-context';
import { platformMetrics } from '@/ai-platform/observability/metrics/platform-metrics';

describe('ai-event-logger', () => {
  it('builds unified run completed events with trace context', () => {
    const event = runWithTraceContext(
      {
        runId: 'run-1',
        agentId: 'tutor',
        correlationId: 'corr-1',
      },
      () =>
        buildAiRunLogEvent('ai.agent.run.completed', {
          status: 'completed',
          model: 'gpt-4o-mini',
          provider: 'openai',
          inputTokens: 100,
          outputTokens: 40,
          embeddingTokens: 12,
          costUsd: 0.002,
          durationMs: 900,
          tokenUsageEstimated: false,
        }),
    );

    expect(event).toMatchObject({
      event: 'ai.agent.run.completed',
      runId: 'run-1',
      agentId: 'tutor',
      correlationId: 'corr-1',
      model: 'gpt-4o-mini',
      provider: 'openai',
      inputTokens: 100,
      outputTokens: 40,
      embeddingTokens: 12,
      costUsd: 0.002,
      durationMs: 900,
      status: 'completed',
      tokenUsageEstimated: false,
    });
  });

  it('builds failed run events with error code', () => {
    const event = buildAiRunLogEvent('ai.agent.run.failed', {
      runId: 'run-2',
      agentId: 'tutor',
      status: 'failed',
      errorCode: 'RATE_LIMITED',
      durationMs: 120,
    });

    expect(event).toMatchObject({
      event: 'ai.agent.run.failed',
      runId: 'run-2',
      agentId: 'tutor',
      status: 'failed',
      errorCode: 'RATE_LIMITED',
      durationMs: 120,
    });
  });

  it('strips forbidden prompt and response fields', () => {
    const event = sanitizeAiLogEvent({
      event: 'ai.agent.run.completed',
      status: 'completed',
      runId: 'run-3',
      agentId: 'tutor',
      prompt: 'secret',
      response: 'secret',
      model: 'gpt-4o-mini',
    } as AiRunLogEvent & Record<string, string>);

    expect('prompt' in event).toBe(false);
    expect('response' in event).toBe(false);
    expect(event.model).toBe('gpt-4o-mini');
  });
});

describe('platform-metrics', () => {
  it('records standardized run outcome metrics without throwing', () => {
    expect(() =>
      platformMetrics.recordRunOutcome({
        agentId: 'tutor',
        model: 'gpt-4o-mini',
        provider: 'openai',
        embeddingModel: 'text-embedding-3-small',
        durationMs: 500,
        inputTokens: 100,
        outputTokens: 40,
        embeddingTokens: 12,
        costUsd: 0.002,
      }),
    ).not.toThrow();
  });

  it('records request errors with agent and error code labels', () => {
    expect(() =>
      platformMetrics.incrementRequestError('tutor', 'RUNTIME_ERROR'),
    ).not.toThrow();
  });

  it('skips zero token and cost increments', () => {
    expect(() => {
      platformMetrics.incrementLlmTokens('gpt-4o-mini', 'openai', 'input', 0);
      platformMetrics.incrementEmbeddingTokens('text-embedding-3-small', 0);
      platformMetrics.incrementCostUsd('gpt-4o-mini', 'openai', 'tutor', 0);
    }).not.toThrow();
  });
});
