import type { ProviderId, ProviderRawUsage } from './usage-types';

export function mapOpenAiUsage(usage: {
  prompt_tokens?: number | null;
  completion_tokens?: number | null;
}): ProviderRawUsage {
  return {
    inputTokens: usage.prompt_tokens ?? undefined,
    outputTokens: usage.completion_tokens ?? undefined,
  };
}

export function mapAnthropicUsage(usage: {
  input_tokens?: number | null;
  output_tokens?: number | null;
}): ProviderRawUsage {
  return {
    inputTokens: usage.input_tokens ?? undefined,
    outputTokens: usage.output_tokens ?? undefined,
  };
}

export function mapGeminiUsage(usage: {
  promptTokenCount?: number | null;
  candidatesTokenCount?: number | null;
  totalTokenCount?: number | null;
}): ProviderRawUsage {
  const inputTokens = usage.promptTokenCount ?? undefined;
  const outputTokens = usage.candidatesTokenCount ?? undefined;

  if (inputTokens !== undefined || outputTokens !== undefined) {
    return { inputTokens, outputTokens };
  }

  if (usage.totalTokenCount != null && usage.totalTokenCount > 0) {
    return {
      inputTokens: usage.totalTokenCount,
      outputTokens: 0,
    };
  }

  return {};
}

export function mergeProviderRawUsage(
  current: ProviderRawUsage,
  incoming: ProviderRawUsage,
): ProviderRawUsage {
  return {
    inputTokens:
      incoming.inputTokens != null
        ? Math.max(current.inputTokens ?? 0, incoming.inputTokens)
        : current.inputTokens,
    outputTokens:
      incoming.outputTokens != null
        ? Math.max(current.outputTokens ?? 0, incoming.outputTokens)
        : current.outputTokens,
  };
}

export function parseAnthropicStreamUsageEvent(payload: {
  type?: string;
  message?: { usage?: { input_tokens?: number; output_tokens?: number } };
  usage?: { input_tokens?: number; output_tokens?: number };
}): ProviderRawUsage | null {
  if (payload.type === 'message_start' && payload.message?.usage) {
    return mapAnthropicUsage(payload.message.usage);
  }

  if (payload.usage) {
    return mapAnthropicUsage(payload.usage);
  }

  return null;
}

export function parseGeminiStreamUsageEvent(payload: {
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}): ProviderRawUsage | null {
  if (!payload.usageMetadata) {
    return null;
  }

  return mapGeminiUsage(payload.usageMetadata);
}

export function providerIdFromModel(model: string): ProviderId {
  const normalized = model.toLowerCase();
  if (normalized.includes('claude') || normalized.includes('anthropic/')) {
    return 'anthropic';
  }
  if (normalized.includes('gemini') || normalized.includes('google/')) {
    return 'gemini';
  }
  return 'openai';
}
