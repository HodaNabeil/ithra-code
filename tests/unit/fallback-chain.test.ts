import { describe, expect, it } from 'vitest';

import type { LlmPort } from '@/ai-platform/domain/ports/llm.port';
import { FallbackLlmAdapter } from '@/ai-platform/router/fallback-chain';
import {
  registerLlmProvider,
  resetProviderRegistryForTests,
} from '@/ai-platform/providers/registry/provider-registry';

function createMockAdapter(model: string, shouldFail = false): LlmPort {
  return {
    async *streamAnswer() {
      if (shouldFail) {
        throw new Error(`fail ${model}`);
      }
      yield 'ok';
    },
    async complete() {
      if (shouldFail) {
        throw new Error(`fail ${model}`);
      }
      return { content: 'ok' };
    },
  };
}

describe('FallbackLlmAdapter', () => {
  it('reports served model via onModelServed when fallback succeeds', async () => {
    resetProviderRegistryForTests();
    registerLlmProvider('openai', createMockAdapter('primary', true), ['primary']);
    registerLlmProvider('anthropic', createMockAdapter('fallback'), ['fallback']);

    const adapter = new FallbackLlmAdapter({
      primaryModel: 'primary',
      fallbacks: ['fallback'],
    });

    const served: string[] = [];
    for await (const token of adapter.streamAnswer({
      systemPrompt: 'sys',
      messages: [{ role: 'user', content: 'hi' }],
      model: 'primary',
      onModelServed: (model) => served.push(model),
    })) {
      expect(token).toBe('ok');
    }

    expect(served).toEqual(['fallback']);
  });
});
