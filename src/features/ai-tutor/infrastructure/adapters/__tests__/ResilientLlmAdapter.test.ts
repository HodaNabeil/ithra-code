import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ResilientLlmAdapter } from '@/features/ai-tutor/infrastructure/adapters/ResilientLlmAdapter';
import { LlmError, LlmErrorCodes, type LlmPort } from '@/features/ai-tutor/domain/ports/LlmPort';

class FlakyLlm implements LlmPort {
  constructor(private readonly failTimes: number) {}

  private attempts = 0;

  async *streamAnswer() {
    this.attempts += 1;
    if (this.attempts <= this.failTimes) {
      throw new LlmError(LlmErrorCodes.RATE_LIMITED, 'rate limited', true);
    }

    yield 'ok';
  }
}

describe('ResilientLlmAdapter', () => {
  it('retries retryable LLM failures before succeeding', async () => {
    const adapter = new ResilientLlmAdapter(new FlakyLlm(2));
    const tokens: string[] = [];

    for await (const token of adapter.streamAnswer({
      systemPrompt: 'sys',
      messages: [{ role: 'user', content: 'hi' }],
    })) {
      tokens.push(token);
    }

    assert.deepEqual(tokens, ['ok']);
  });
});
