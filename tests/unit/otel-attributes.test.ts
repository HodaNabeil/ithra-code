import { describe, expect, it, vi } from 'vitest';

import {
  buildAgentRunSpanAttributes,
  buildLedgerCompleteSpanAttributes,
  buildScopeSpanAttributes,
  sanitizeOtelAttributes,
} from '@/ai-platform/observability/opentelemetry/otel-attributes';

describe('otel-attributes', () => {
  it('hashes raw user and scope identifiers', () => {
    const attributes = sanitizeOtelAttributes({
      'ai.user.id': 'user-123',
      'ai.course.id': 'course-abc',
      'ai.lecture.id': 'lecture-xyz',
      'ai.agent.id': 'tutor',
    });

    expect(attributes['ai.user.id']).toBeUndefined();
    expect(attributes['ai.course.id']).toBeUndefined();
    expect(attributes['ai.lecture.id']).toBeUndefined();
    expect(attributes['ai.user.id_hash']).toMatch(/^hash:[a-f0-9]{16}$/);
    expect(attributes['ai.course.id_hash']).toMatch(/^hash:[a-f0-9]{16}$/);
    expect(attributes['ai.lecture.id_hash']).toMatch(/^hash:[a-f0-9]{16}$/);
    expect(attributes['ai.agent.id']).toBe('tutor');
  });

  it('drops forbidden prompt and response attributes', () => {
    const attributes = sanitizeOtelAttributes({
      prompt: 'secret prompt',
      response: 'secret answer',
      'ai.messages.content': 'hello',
      'ai.agent.id': 'tutor',
    });

    expect(attributes.prompt).toBeUndefined();
    expect(attributes.response).toBeUndefined();
    expect(attributes['ai.messages.content']).toBeUndefined();
    expect(attributes['ai.agent.id']).toBe('tutor');
  });

  it('builds agent run attributes without raw user id', () => {
    const attributes = buildAgentRunSpanAttributes({
      agentId: 'tutor',
      runId: 'run-1',
      userId: 'user-123',
      correlationId: 'corr-1',
      promptVersion: 3,
      mode: 'stream',
    });

    expect(attributes['ai.agent.id']).toBe('tutor');
    expect(attributes['ai.run.id']).toBe('run-1');
    expect(attributes['ai.correlation.id']).toBe('corr-1');
    expect(attributes['ai.prompt.version']).toBe('3');
    expect(attributes['ai.agent.mode']).toBe('stream');
    expect(attributes['ai.user.id']).toBeUndefined();
    expect(attributes['ai.user.id_hash']).toMatch(/^hash:/);
  });

  it('builds ledger attributes with billing fields only', () => {
    const attributes = buildLedgerCompleteSpanAttributes({
      runId: 'run-1',
      agentId: 'tutor',
      model: 'gpt-4o-mini',
      provider: 'openai',
      inputTokens: 100,
      outputTokens: 40,
      embeddingTokens: 12,
      estimatedCostUsd: 0.002,
      tokenUsageEstimated: false,
      latencyMs: 900,
    });

    expect(attributes).toEqual({
      'ai.run.id': 'run-1',
      'ai.agent.id': 'tutor',
      'ai.model': 'gpt-4o-mini',
      'ai.provider': 'openai',
      'ai.tokens.input': 100,
      'ai.tokens.output': 40,
      'ai.tokens.embedding': 12,
      'ai.cost.usd': 0.002,
      'ai.usage.estimated': false,
      'ai.latency.ms': 900,
    });
  });

  it('preserves lecture none sentinel without hashing', () => {
    const attributes = buildScopeSpanAttributes({
      courseId: 'course-abc',
      lectureId: undefined,
    });

    expect(attributes['ai.course.id_hash']).toMatch(/^hash:/);
    expect(attributes['ai.lecture.id']).toBe('none');
  });

  it('uses stable hash salt from env when provided', () => {
    vi.stubEnv('LANGSMITH_PII_SALT', 'test-salt');

    const first = buildAgentRunSpanAttributes({
      agentId: 'tutor',
      userId: 'user-123',
    });
    const second = buildAgentRunSpanAttributes({
      agentId: 'tutor',
      userId: 'user-123',
    });

    expect(first['ai.user.id_hash']).toBe(second['ai.user.id_hash']);
    vi.unstubAllEnvs();
  });
});
