import assert from 'node:assert/strict';

import { resolveModelChain } from '@/ai-platform/router/fallback-chain';

function main(): void {
  const chain = {
    primaryModel: 'env-default',
    fallbacks: ['fallback-a', 'fallback-b'],
  };

  assert.deepEqual(resolveModelChain(chain), ['env-default', 'fallback-a', 'fallback-b']);
  assert.deepEqual(resolveModelChain(chain, 'caller-model'), [
    'caller-model',
    'fallback-a',
    'fallback-b',
  ]);
  assert.deepEqual(resolveModelChain(chain, 'fallback-a'), [
    'fallback-a',
    'fallback-b',
  ]);

  console.log('[verify-model-routing] PASS');
}

try {
  main();
} catch (error) {
  console.error('[verify-model-routing] FAIL', error);
  process.exit(1);
}
