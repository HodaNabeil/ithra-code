/**
 * Per-model token pricing (USD per token).
 * @see docs/ai-platform/09-observability.md
 */
const TOKEN_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-3.5-turbo': { input: 0.5 / 1_000_000, output: 1.5 / 1_000_000 },
  'gpt-4o-mini': { input: 0.15 / 1_000_000, output: 0.6 / 1_000_000 },
  'gpt-4o': { input: 2.5 / 1_000_000, output: 10.0 / 1_000_000 },
  'claude-3-5-haiku-20241022': { input: 0.8 / 1_000_000, output: 4.0 / 1_000_000 },
  'claude-3-5-sonnet-20241022': { input: 3.0 / 1_000_000, output: 15.0 / 1_000_000 },
  'gemini-2.0-flash': { input: 0.1 / 1_000_000, output: 0.4 / 1_000_000 },
  'gemini-1.5-flash': { input: 0.075 / 1_000_000, output: 0.3 / 1_000_000 },
  'text-embedding-3-small': { input: 0.02 / 1_000_000, output: 0 },
  'openai/text-embedding-3-small': { input: 0.02 / 1_000_000, output: 0 },
};

const DEFAULT_PRICING = { input: 1.0 / 1_000_000, output: 2.0 / 1_000_000 };

export function getModelPricing(model: string): { input: number; output: number } {
  return TOKEN_PRICING[model] ?? DEFAULT_PRICING;
}

export function estimateCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const pricing = getModelPricing(model);
  return inputTokens * pricing.input + outputTokens * pricing.output;
}
