import assert from 'node:assert/strict';

import { accumulateTokensUsed } from '@/ai-platform/graph/state/shared-channels';

function main(): void {
  const first = accumulateTokensUsed(
    { input: 0, output: 0 },
    { input: 100, output: 20 },
  );
  const total = accumulateTokensUsed(first, { input: 50, output: 10 });

  assert.deepEqual(total, { input: 150, output: 30 });

  function inferProvider(model: string): string {
    if (model.startsWith('claude')) {
      return 'anthropic';
    }
    if (model.startsWith('gemini')) {
      return 'gemini';
    }
    return 'openai';
  }

  assert.equal(inferProvider('claude-3-5-haiku-20241022'), 'anthropic');
  assert.equal(inferProvider('gemini-2.0-flash'), 'gemini');
  assert.equal(inferProvider('gpt-4o-mini'), 'openai');

  console.log('[verify-token-accounting] PASS');
}

try {
  main();
} catch (error) {
  console.error('[verify-token-accounting] FAIL', error);
  process.exit(1);
}
