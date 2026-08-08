import type {
  NormalizedTokenUsage,
  ProviderRawUsage,
} from './usage-types';
import { providerIdFromModel } from './provider-usage-mappers';

/**
 * Last-resort token estimate when a provider does not return usage.
 * Not suitable as billing truth — always paired with tokenUsageEstimated=true.
 */
export function estimateTokensFromText(text: string, _model?: string): number {
  if (!text) {
    return 0;
  }
  return Math.ceil(text.length / 4);
}

export function emptyNormalizedUsage(): NormalizedTokenUsage {
  return {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    tokenUsageEstimated: false,
    source: 'provider',
  };
}

export function normalizeFromProvider(
  raw: ProviderRawUsage,
): NormalizedTokenUsage | null {
  const inputTokens = raw.inputTokens ?? 0;
  const outputTokens = raw.outputTokens ?? 0;

  if (inputTokens <= 0 && outputTokens <= 0) {
    return null;
  }

  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    tokenUsageEstimated: false,
    source: 'provider',
  };
}

export function estimateUsageFromText(params: {
  inputText?: string;
  outputText?: string;
  model?: string;
}): NormalizedTokenUsage {
  const inputTokens = params.inputText
    ? estimateTokensFromText(params.inputText, params.model)
    : 0;
  const outputTokens = params.outputText
    ? estimateTokensFromText(params.outputText, params.model)
    : 0;

  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    tokenUsageEstimated: true,
    source: 'tokenizer_estimate',
  };
}

export type ResolveUsageFallback = {
  inputText?: string;
  outputText?: string;
  model?: string;
};

/**
 * Prefer provider-reported usage. Fill missing sides from text estimate only when needed.
 */
export function resolveTokenUsage(
  providerUsage: ProviderRawUsage | null | undefined,
  fallback: ResolveUsageFallback,
): NormalizedTokenUsage {
  const fromProvider = providerUsage ? normalizeFromProvider(providerUsage) : null;

  if (!fromProvider) {
    return estimateUsageFromText(fallback);
  }

  let { inputTokens, outputTokens } = fromProvider;
  let tokenUsageEstimated = false;

  if (inputTokens <= 0 && fallback.inputText) {
    inputTokens = estimateTokensFromText(fallback.inputText, fallback.model);
    tokenUsageEstimated = true;
  }

  if (outputTokens <= 0 && fallback.outputText) {
    outputTokens = estimateTokensFromText(fallback.outputText, fallback.model);
    tokenUsageEstimated = true;
  }

  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    tokenUsageEstimated,
    source: tokenUsageEstimated ? 'tokenizer_estimate' : 'provider',
  };
}

export function mergeNormalizedUsage(
  left: NormalizedTokenUsage,
  right: NormalizedTokenUsage,
): NormalizedTokenUsage {
  return {
    inputTokens: left.inputTokens + right.inputTokens,
    outputTokens: left.outputTokens + right.outputTokens,
    totalTokens: left.totalTokens + right.totalTokens,
    tokenUsageEstimated:
      left.tokenUsageEstimated || right.tokenUsageEstimated,
    source:
      left.tokenUsageEstimated || right.tokenUsageEstimated
        ? 'tokenizer_estimate'
        : left.source ?? right.source,
  };
}

export function toLegacyTokenCounts(usage: NormalizedTokenUsage): {
  input: number;
  output: number;
} {
  return {
    input: usage.inputTokens,
    output: usage.outputTokens,
  };
}

export function fromLegacyTokenCounts(
  input: number,
  output: number,
  tokenUsageEstimated = false,
): NormalizedTokenUsage {
  return {
    inputTokens: input,
    outputTokens: output,
    totalTokens: input + output,
    tokenUsageEstimated,
    source: tokenUsageEstimated ? 'tokenizer_estimate' : 'provider',
  };
}

export function buildRunSignalsUpdate(params: {
  usage: NormalizedTokenUsage;
  servedModel?: string;
}): { runSignals?: Record<string, unknown> } {
  const runSignals: Record<string, unknown> = {};

  if (params.usage.tokenUsageEstimated) {
    runSignals.tokenUsageEstimated = true;
  }

  if (params.servedModel) {
    runSignals.actualModel = params.servedModel;
    runSignals.actualProvider = providerIdFromModel(params.servedModel);
  }

  return Object.keys(runSignals).length > 0 ? { runSignals } : {};
}

export function toGraphTokenUpdate(
  usage: NormalizedTokenUsage,
  servedModel?: string,
): {
  tokensUsed: { input: number; output: number };
  runSignals?: Record<string, unknown>;
} {
  return {
    tokensUsed: toLegacyTokenCounts(usage),
    ...buildRunSignalsUpdate({ usage, servedModel }),
  };
}

export function readRunTokenUsageEstimated(
  runSignals?: Record<string, unknown>,
): boolean {
  return runSignals?.tokenUsageEstimated === true;
}

export function readActualModelFromRunSignals(
  runSignals?: Record<string, unknown>,
): string | undefined {
  return typeof runSignals?.actualModel === 'string'
    ? runSignals.actualModel
    : undefined;
}

export function readActualProviderFromRunSignals(
  runSignals?: Record<string, unknown>,
): string | undefined {
  return typeof runSignals?.actualProvider === 'string'
    ? runSignals.actualProvider
    : undefined;
}

export function toLlmTokenUsage(
  usage: NormalizedTokenUsage,
): { input: number; output: number } {
  return toLegacyTokenCounts(usage);
}
