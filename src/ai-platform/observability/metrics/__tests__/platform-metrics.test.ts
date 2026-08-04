import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { platformMetrics } from '../platform-metrics';

describe('platform metrics', () => {
  it('increments agent run counters', () => {
    platformMetrics.incrementAgentRun('tutor', 'completed');
    const text = platformMetrics.toPrometheusText();
    assert.match(text, /ai_agent_runs_total/);
    assert.match(text, /agent_id="tutor"/);
  });

  it('records duration histograms in prometheus text', () => {
    platformMetrics.recordAgentDuration('tutor', 120);
    const text = platformMetrics.toPrometheusText();
    assert.match(text, /ai_agent_run_duration_ms/);
    assert.match(text, /_count/);
    assert.match(text, /_sum/);
  });

  it('tracks LLM token usage', () => {
    platformMetrics.incrementLlmTokens('gpt-4o', 'input', 100);
    const text = platformMetrics.toPrometheusText();
    assert.match(text, /ai_llm_tokens_total/);
    assert.match(text, /direction="input"/);
  });
});
