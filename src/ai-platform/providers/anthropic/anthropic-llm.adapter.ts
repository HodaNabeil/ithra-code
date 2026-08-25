import { AIPlatformConfig } from '../../infrastructure/config/ai-platform.config';
import {
  LlmError,
  LlmErrorCodes,
  type LlmCompleteOptions,
  type LlmCompleteResult,
  type LlmMessage,
  type LlmPort,
  type LlmStreamOptions,
} from '../../domain/ports/llm.port';
import {
  mapAnthropicUsage,
  mergeProviderRawUsage,
  parseAnthropicStreamUsageEvent,
  type ProviderRawUsage,
} from '../../observability/usage';
import { createLinkedAbortController } from '../abort-signal';

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class AnthropicLlmAdapter implements LlmPort {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly defaultTemperature: number;
  private readonly defaultMaxTokens: number;
  private readonly requestTimeoutMs: number;

  constructor(apiKey: string, options?: { model?: string }) {
    const config = AIPlatformConfig.getLlmConfig();
    this.apiKey = apiKey;
    this.model = options?.model ?? 'claude-3-5-haiku-20241022';
    this.defaultTemperature = config.temperature;
    this.defaultMaxTokens = config.maxTokens;
    this.requestTimeoutMs = config.requestTimeoutMs;
  }

  async *streamAnswer(
    options: LlmStreamOptions,
  ): AsyncIterableIterator<string> {
    const { controller, cleanup } = createLinkedAbortController(
      this.requestTimeoutMs,
      options.signal,
    );

    let accumulatedUsage: ProviderRawUsage = {};

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: options.model ?? this.model,
          system: options.systemPrompt,
          messages: this.toAnthropicMessages(options.messages),
          max_tokens: options.maxTokens ?? this.defaultMaxTokens,
          temperature: options.temperature ?? this.defaultTemperature,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw await this.mapHttpError(response);
      }

      if (!response.body) {
        throw new LlmError(
          LlmErrorCodes.UNKNOWN,
          'Anthropic stream body missing',
          false,
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) {
            continue;
          }

          const payload = line.slice(6).trim();
          if (!payload || payload === '[DONE]') {
            continue;
          }

          try {
            const event = JSON.parse(payload) as {
              type?: string;
              delta?: { type?: string; text?: string };
              message?: {
                usage?: { input_tokens?: number; output_tokens?: number };
              };
              usage?: { input_tokens?: number; output_tokens?: number };
            };

            const usagePatch = parseAnthropicStreamUsageEvent(event);
            if (usagePatch) {
              accumulatedUsage = mergeProviderRawUsage(
                accumulatedUsage,
                usagePatch,
              );
            }

            if (
              event.type === 'content_block_delta' &&
              event.delta?.type === 'text_delta' &&
              event.delta.text
            ) {
              yield event.delta.text;
            }
          } catch {
            // Ignore malformed SSE chunks.
          }
        }
      }

      if (options.onUsage) {
        const input = accumulatedUsage.inputTokens ?? 0;
        const output = accumulatedUsage.outputTokens ?? 0;
        if (input > 0 || output > 0) {
          options.onUsage({ input, output });
        }
      }
    } catch (error) {
      throw this.mapError(error, options.signal);
    } finally {
      cleanup();
    }
  }

  async complete(options: LlmCompleteOptions): Promise<LlmCompleteResult> {
    const { controller, cleanup } = createLinkedAbortController(
      this.requestTimeoutMs,
      options.signal,
    );

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: options.model ?? this.model,
          system: options.systemPrompt,
          messages: this.toAnthropicMessages(options.messages),
          max_tokens: options.maxTokens ?? this.defaultMaxTokens,
          temperature: options.temperature ?? this.defaultTemperature,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw await this.mapHttpError(response);
      }

      const payload = (await response.json()) as {
        content?: Array<{ type: string; text?: string }>;
        usage?: { input_tokens?: number; output_tokens?: number };
      };

      const content =
        payload.content?.find((block) => block.type === 'text')?.text ?? '';

      const mappedUsage = payload.usage
        ? mapAnthropicUsage(payload.usage)
        : undefined;

      return {
        content,
        usage: mappedUsage
          ? {
              input: mappedUsage.inputTokens ?? 0,
              output: mappedUsage.outputTokens ?? 0,
            }
          : undefined,
      };
    } catch (error) {
      throw this.mapError(error, options.signal);
    } finally {
      cleanup();
    }
  }

  private toAnthropicMessages(messages: LlmMessage[]): AnthropicMessage[] {
    return messages
      .filter((message) => message.role !== 'system')
      .map((message) => ({
        role: message.role === 'assistant' ? 'assistant' : 'user',
        content: message.content,
      }));
  }

  private async mapHttpError(response: Response): Promise<LlmError> {
    const status = response.status;
    if (status === 429) {
      return new LlmError(
        LlmErrorCodes.RATE_LIMITED,
        'Anthropic rate limited',
        true,
      );
    }
    if (status >= 500) {
      return new LlmError(
        LlmErrorCodes.SERVICE_UNAVAILABLE,
        'Anthropic unavailable',
        true,
      );
    }
    const body = await response.text();
    return new LlmError(
      LlmErrorCodes.UNKNOWN,
      body || 'Anthropic request failed',
      false,
    );
  }

  private mapError(error: unknown, signal?: AbortSignal): LlmError {
    if (error instanceof LlmError) {
      return error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      if (signal?.aborted) {
        return new LlmError(
          LlmErrorCodes.INVALID_REQUEST,
          'Anthropic request aborted',
          false,
        );
      }
      return new LlmError(
        LlmErrorCodes.TIMEOUT,
        'Anthropic request timed out',
        true,
      );
    }
    return new LlmError(
      LlmErrorCodes.UNKNOWN,
      error instanceof Error ? error.message : 'Anthropic error',
      false,
    );
  }
}
