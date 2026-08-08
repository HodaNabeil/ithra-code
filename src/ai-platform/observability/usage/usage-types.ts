/**
 * Normalized token usage — platform-wide shape for billing and observability.
 * Provider-specific fields stay in provider adapters / mappers.
 */

export type UsageSource = 'provider' | 'tokenizer_estimate';

export interface NormalizedTokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  tokenUsageEstimated: boolean;
  source?: UsageSource;
}

/** Raw counts from a provider response before normalization. */
export interface ProviderRawUsage {
  inputTokens?: number | null;
  outputTokens?: number | null;
}

export type ProviderId = 'openai' | 'anthropic' | 'gemini';
