import { describe, expect, it, vi } from 'vitest';

import { AnthropicLlmAdapter } from '@/ai-platform/providers/anthropic/anthropic-llm.adapter';
import { GeminiLlmAdapter } from '@/ai-platform/providers/gemini/gemini-llm.adapter';
import { mapOpenAiUsage } from '@/ai-platform/observability/usage';

function createSseResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });

  return new Response(stream, { status: 200 });
}

describe('LLM provider usage parsing', () => {
  it('OpenAI usage mapper preserves provider counts', () => {
    const mapped = mapOpenAiUsage({ prompt_tokens: 14, completion_tokens: 3 });
    expect(mapped).toEqual({ inputTokens: 14, outputTokens: 3 });
  });

  it('Anthropic stream reports usage from SSE events', async () => {
    const adapter = new AnthropicLlmAdapter('test-key');
    const fetchMock = vi.fn().mockResolvedValue(
      createSseResponse([
        'data: {"type":"message_start","message":{"usage":{"input_tokens":25,"output_tokens":1}}}\n\n',
        'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}\n\n',
        'data: {"type":"message_delta","usage":{"output_tokens":5}}\n\n',
      ]),
    );

    vi.stubGlobal('fetch', fetchMock);

    let captured: { input: number; output: number } | undefined;
    const tokens: string[] = [];

    for await (const token of adapter.streamAnswer({
      systemPrompt: 'sys',
      messages: [{ role: 'user', content: 'hello' }],
      onUsage: (usage) => {
        captured = usage;
      },
    })) {
      tokens.push(token);
    }

    expect(tokens.join('')).toBe('Hello');
    expect(captured).toEqual({ input: 25, output: 5 });

    vi.unstubAllGlobals();
  });

  it('Gemini stream reports usageMetadata from SSE events', async () => {
    const adapter = new GeminiLlmAdapter('test-key');
    const fetchMock = vi.fn().mockResolvedValue(
      createSseResponse([
        'data: {"candidates":[{"content":{"parts":[{"text":"Hi"}]}}],"usageMetadata":{"promptTokenCount":9,"candidatesTokenCount":2,"totalTokenCount":11}}\n\n',
      ]),
    );

    vi.stubGlobal('fetch', fetchMock);

    let captured: { input: number; output: number } | undefined;
    const tokens: string[] = [];

    for await (const token of adapter.streamAnswer({
      systemPrompt: 'sys',
      messages: [{ role: 'user', content: 'hello' }],
      onUsage: (usage) => {
        captured = usage;
      },
    })) {
      tokens.push(token);
    }

    expect(tokens.join('')).toBe('Hi');
    expect(captured).toEqual({ input: 9, output: 2 });

    vi.unstubAllGlobals();
  });

  it('Anthropic complete returns provider usage when present', async () => {
    const adapter = new AnthropicLlmAdapter('test-key');
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          content: [{ type: 'text', text: 'Answer' }],
          usage: { input_tokens: 30, output_tokens: 8 },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    vi.stubGlobal('fetch', fetchMock);

    const result = await adapter.complete({
      systemPrompt: 'sys',
      messages: [{ role: 'user', content: 'hello' }],
    });

    expect(result.content).toBe('Answer');
    expect(result.usage).toEqual({ input: 30, output: 8 });

    vi.unstubAllGlobals();
  });

  it('Gemini complete returns provider usage when present', async () => {
    const adapter = new GeminiLlmAdapter('test-key');
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: 'Answer' }] } }],
          usageMetadata: { promptTokenCount: 18, candidatesTokenCount: 4 },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    vi.stubGlobal('fetch', fetchMock);

    const result = await adapter.complete({
      systemPrompt: 'sys',
      messages: [{ role: 'user', content: 'hello' }],
    });

    expect(result.content).toBe('Answer');
    expect(result.usage).toEqual({ input: 18, output: 4 });

    vi.unstubAllGlobals();
  });
});
