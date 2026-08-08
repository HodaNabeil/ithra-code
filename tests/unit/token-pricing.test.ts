import { afterEach, describe, expect, it } from 'vitest';

import {
  computeRunCostUsd,
  estimateCostUsd,
  getModelPricing,
  resetTokenPricingForTests,
} from '@/ai-platform/observability/cost/token-pricing';

describe('token-pricing', () => {
  afterEach(() => {
    resetTokenPricingForTests();
    delete process.env.AI_PLATFORM_MODEL_PRICING_JSON;
  });

  it('returns built-in pricing for known models', () => {
    const pricing = getModelPricing('gpt-4o-mini');
    expect(pricing.input).toBe(0.15 / 1_000_000);
    expect(pricing.output).toBe(0.6 / 1_000_000);
  });

  it('uses default pricing for unknown models', () => {
    const pricing = getModelPricing('unknown-model-xyz');
    expect(pricing.input).toBe(1.0 / 1_000_000);
    expect(pricing.output).toBe(2.0 / 1_000_000);
  });

  it('overrides pricing from AI_PLATFORM_MODEL_PRICING_JSON', () => {
    process.env.AI_PLATFORM_MODEL_PRICING_JSON = JSON.stringify({
      'custom-model': { input: 0.001, output: 0.002 },
    });

    resetTokenPricingForTests();

    const pricing = getModelPricing('custom-model');
    expect(pricing).toEqual({ input: 0.001, output: 0.002 });
    expect(estimateCostUsd('custom-model', 1000, 500)).toBe(2);
  });

  it('computes run cost with embedding tokens', () => {
    const cost = computeRunCostUsd({
      model: 'gpt-4o-mini',
      inputTokens: 1_000_000,
      outputTokens: 0,
      embeddingModel: 'text-embedding-3-small',
      embeddingTokens: 1_000_000,
    });

    expect(cost).toBe(0.15 + 0.02);
  });

  it('prices on actual model when rates differ', () => {
    const cheapModel = estimateCostUsd('gpt-4o-mini', 1_000_000, 0);
    const expensiveModel = estimateCostUsd('gpt-4o', 1_000_000, 0);

    expect(expensiveModel).toBeGreaterThan(cheapModel);
  });
});
