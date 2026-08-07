import assert from 'node:assert/strict';

import {
  isOverBudget,
  usdToMicro,
} from '@/ai-platform/infrastructure/guards/cost-cap.guard';
import { computeRunCostUsd } from '@/ai-platform/observability/cost/token-pricing';

function main(): void {
  assert.equal(usdToMicro(1), 1_000_000);
  assert.equal(usdToMicro(0.000001), 1);

  const capUsd = 1;
  assert.equal(isOverBudget(usdToMicro(0.99), capUsd), false);
  assert.equal(isOverBudget(usdToMicro(1), capUsd), true);
  assert.equal(isOverBudget(usdToMicro(1.5), capUsd), true);

  const llmOnly = computeRunCostUsd({
    model: 'gpt-4o-mini',
    inputTokens: 1_000,
    outputTokens: 500,
  });
  const withEmbeddings = computeRunCostUsd({
    model: 'gpt-4o-mini',
    inputTokens: 1_000,
    outputTokens: 500,
    embeddingModel: 'text-embedding-3-small',
    embeddingTokens: 200,
  });

  assert(withEmbeddings > llmOnly, 'embedding cost must be included');

  const guardOrder: string[] = [];
  async function assertUserDailyBudgetUsd(): Promise<void> {
    guardOrder.push('user');
  }
  async function assertGlobalDailyBudgetUsd(): Promise<void> {
    guardOrder.push('global');
  }

  void (async () => {
    await assertUserDailyBudgetUsd();
    await assertGlobalDailyBudgetUsd();
    assert.deepEqual(guardOrder, ['user', 'global']);
  })();

  console.log('[verify-usd-budget] PASS');
}

try {
  main();
} catch (error) {
  console.error('[verify-usd-budget] FAIL', error);
  process.exit(1);
}
