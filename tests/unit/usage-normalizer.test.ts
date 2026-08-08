import { describe, expect, it } from 'vitest';

import {
  estimateTokensFromText,
  estimateUsageFromText,
  mergeNormalizedUsage,
  normalizeFromProvider,
  readRunTokenUsageEstimated,
  resolveTokenUsage,
  toGraphTokenUpdate,
} from '@/ai-platform/observability/usage';
import {
  mapAnthropicUsage,
  mapGeminiUsage,
  mapOpenAiUsage,
  mergeProviderRawUsage,
  parseAnthropicStreamUsageEvent,
  parseGeminiStreamUsageEvent,
} from '@/ai-platform/observability/usage';

describe('usage-normalizer', () => {
  it('normalizes provider usage as actual (not estimated)', () => {
    const usage = normalizeFromProvider({ inputTokens: 120, outputTokens: 45 });
    expect(usage).toEqual({
      inputTokens: 120,
      outputTokens: 45,
      totalTokens: 165,
      tokenUsageEstimated: false,
      source: 'provider',
    });
  });

  it('returns null when provider usage is empty', () => {
    expect(normalizeFromProvider({ inputTokens: 0, outputTokens: 0 })).toBeNull();
  });

  it('marks text fallback as estimated', () => {
    const usage = estimateUsageFromText({
      inputText: 'مرحبا بالعالم',
      outputText: 'رد المساعد',
    });

    expect(usage.tokenUsageEstimated).toBe(true);
    expect(usage.source).toBe('tokenizer_estimate');
    expect(usage.totalTokens).toBe(usage.inputTokens + usage.outputTokens);
    expect(usage.inputTokens).toBeGreaterThan(0);
  });

  it('prefers provider usage over text fallback', () => {
    const usage = resolveTokenUsage(
      { inputTokens: 50, outputTokens: 20 },
      { inputText: 'ignored', outputText: 'ignored' },
    );

    expect(usage).toMatchObject({
      inputTokens: 50,
      outputTokens: 20,
      totalTokens: 70,
      tokenUsageEstimated: false,
      source: 'provider',
    });
  });

  it('fills missing provider side from estimate and marks estimated', () => {
    const usage = resolveTokenUsage(
      { inputTokens: 0, outputTokens: 30 },
      { inputText: 'hello world', outputText: 'done' },
    );

    expect(usage.outputTokens).toBe(30);
    expect(usage.inputTokens).toBe(estimateTokensFromText('hello world'));
    expect(usage.tokenUsageEstimated).toBe(true);
  });

  it('uses fallback when provider usage is missing', () => {
    const usage = resolveTokenUsage(null, {
      inputText: 'prompt',
      outputText: 'answer',
    });

    expect(usage.tokenUsageEstimated).toBe(true);
    expect(usage.totalTokens).toBe(
      estimateTokensFromText('prompt') + estimateTokensFromText('answer'),
    );
  });

  it('merges normalized usage and propagates estimated flag', () => {
    const actual = normalizeFromProvider({ inputTokens: 10, outputTokens: 5 })!;
    const estimated = estimateUsageFromText({ inputText: 'x', outputText: 'y' });
    const merged = mergeNormalizedUsage(actual, estimated);

    expect(merged.inputTokens).toBe(actual.inputTokens + estimated.inputTokens);
    expect(merged.outputTokens).toBe(actual.outputTokens + estimated.outputTokens);
    expect(merged.totalTokens).toBe(merged.inputTokens + merged.outputTokens);
    expect(merged.tokenUsageEstimated).toBe(true);
  });

  it('maps graph token update with estimated run signal', () => {
    const update = toGraphTokenUpdate(
      estimateUsageFromText({ inputText: 'in', outputText: 'out' }),
    );

    expect(update.tokensUsed).toEqual({ input: 1, output: 1 });
    expect(update.runSignals).toEqual({ tokenUsageEstimated: true });
  });

  it('reads tokenUsageEstimated from run signals', () => {
    expect(readRunTokenUsageEstimated({ tokenUsageEstimated: true })).toBe(true);
    expect(readRunTokenUsageEstimated({})).toBe(false);
  });

  it('builds run signals with actual model for billing', () => {
    const update = toGraphTokenUpdate(
      normalizeFromProvider({ inputTokens: 10, outputTokens: 5 })!,
      'claude-3-5-haiku-20241022',
    );

    expect(update.runSignals).toEqual({
      actualModel: 'claude-3-5-haiku-20241022',
      actualProvider: 'anthropic',
    });
  });
});

describe('provider-usage-mappers', () => {
  it('maps OpenAI usage fields', () => {
    expect(mapOpenAiUsage({ prompt_tokens: 11, completion_tokens: 7 })).toEqual({
      inputTokens: 11,
      outputTokens: 7,
    });
  });

  it('maps Anthropic usage fields', () => {
    expect(mapAnthropicUsage({ input_tokens: 22, output_tokens: 9 })).toEqual({
      inputTokens: 22,
      outputTokens: 9,
    });
  });

  it('maps Gemini usage fields', () => {
    expect(
      mapGeminiUsage({ promptTokenCount: 15, candidatesTokenCount: 6 }),
    ).toEqual({
      inputTokens: 15,
      outputTokens: 6,
    });
  });

  it('parses Anthropic stream usage events', () => {
    const start = parseAnthropicStreamUsageEvent({
      type: 'message_start',
      message: { usage: { input_tokens: 40, output_tokens: 1 } },
    });
    const delta = parseAnthropicStreamUsageEvent({
      type: 'message_delta',
      usage: { output_tokens: 18 },
    });

    const merged = mergeProviderRawUsage(start ?? {}, delta ?? {});
    expect(merged).toEqual({ inputTokens: 40, outputTokens: 18 });
  });

  it('parses Gemini stream usage metadata', () => {
    const usage = parseGeminiStreamUsageEvent({
      usageMetadata: {
        promptTokenCount: 33,
        candidatesTokenCount: 12,
        totalTokenCount: 45,
      },
    });

    expect(usage).toEqual({ inputTokens: 33, outputTokens: 12 });
  });
});
