/**
 * Per-model token pricing (USD per token).
 * @see docs/ai-platform/09-observability.md
 */
import { logger } from '@/lib/logger';

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

let envPricingOverride: Record<string, { input: number; output: number }> | null =
  null;
let envPricingLoaded = false;

function parseEnvPricingJson(
  raw: string,
): Record<string, { input: number; output: number }> | null {
  try {
    const parsed = JSON.parse(raw) as Record<
      string,
      { input?: number; output?: number }
    >;

    const normalized: Record<string, { input: number; output: number }> = {};
    for (const [model, rates] of Object.entries(parsed)) {
      if (
        typeof rates?.input !== 'number' ||
        typeof rates?.output !== 'number' ||
        rates.input < 0 ||
        rates.output < 0
      ) {
        logger.warn(
          { model },
          '[AI_TOKEN_PRICING] Skipping invalid env pricing entry',
        );
        continue;
      }
      normalized[model] = { input: rates.input, output: rates.output };
    }

    return normalized;
  } catch (error) {
    logger.warn(
      { error },
      '[AI_TOKEN_PRICING] Failed to parse AI_PLATFORM_MODEL_PRICING_JSON',
    );
    return null;
  }
}

function loadEnvPricingOverride(): Record<
  string,
  { input: number; output: number }
> | null {
  if (envPricingLoaded) {
    return envPricingOverride;
  }

  envPricingLoaded = true;
  const raw = process.env.AI_PLATFORM_MODEL_PRICING_JSON;
  if (!raw) {
    envPricingOverride = null;
    return null;
  }

  envPricingOverride = parseEnvPricingJson(raw);
  return envPricingOverride;
}

/** Clears cached env pricing — for tests only. */
export function resetTokenPricingForTests(): void {
  envPricingOverride = null;
  envPricingLoaded = false;
}

export function getModelPricing(model: string): { input: number; output: number } {
  const envPricing = loadEnvPricingOverride();
  if (envPricing?.[model]) {
    return envPricing[model];
  }
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

export type ComputeRunCostUsdInput = {
  model: string;
  inputTokens: number;
  outputTokens: number;
  embeddingModel?: string;
  embeddingTokens?: number;
};

export function computeRunCostUsd(input: ComputeRunCostUsdInput): number {
  const llmCost = estimateCostUsd(
    input.model,
    input.inputTokens,
    input.outputTokens,
  );

  if (!input.embeddingModel || !input.embeddingTokens) {
    return llmCost;
  }

  return llmCost + estimateCostUsd(input.embeddingModel, input.embeddingTokens, 0);
}
