import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  addSlice,
  type UsageBreakdowns,
  type UsageSlice,
} from '../aggregation.utils';

function emptyBreakdowns(): UsageBreakdowns {
  return { byProvider: {}, byModel: {}, byAgent: {} };
}

describe('aggregation handler helpers', () => {
  it('accumulates usage slices by key', () => {
    const map: Record<string, UsageSlice> = {};
    const run = { inputTokens: 10, outputTokens: 5, estimatedCostUsd: 0.01 };

    addSlice(map, 'openai', run);
    addSlice(map, 'openai', run);

    assert.equal(map.openai?.runs, 2);
    assert.equal(map.openai?.inputTokens, 20);
    assert.equal(map.openai?.outputTokens, 10);
    assert.equal(map.openai?.costUsd, 0.02);
  });

  it('initializes breakdown maps for new keys', () => {
    const breakdowns = emptyBreakdowns();
    const run = { inputTokens: 3, outputTokens: 2, estimatedCostUsd: 0.001 };

    addSlice(breakdowns.byProvider, 'anthropic', run);
    addSlice(breakdowns.byModel, 'claude-3', run);
    addSlice(breakdowns.byAgent, 'tutor', run);

    assert.equal(breakdowns.byProvider.anthropic?.runs, 1);
    assert.equal(breakdowns.byModel['claude-3']?.inputTokens, 3);
    assert.equal(breakdowns.byAgent.tutor?.outputTokens, 2);
  });
});
