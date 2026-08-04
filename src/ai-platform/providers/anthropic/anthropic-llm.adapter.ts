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

  async *streamAnswer(options: LlmStreamOptions): AsyncIterableIterator<string> {
    const result = await this.complete({
      ...options,
      responseFormat: 'text',
    });
    yield result.content;
  }

  async complete(options: LlmCompleteOptions): Promise<LlmCompleteResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);

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
      };

      const content =
        payload.content?.find((block) => block.type === 'text')?.text ?? '';

      return { content };
    } catch (error) {
      throw this.mapError(error);
    } finally {
      clearTimeout(timeout);
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
      return new LlmError(LlmErrorCodes.RATE_LIMITED, 'Anthropic rate limited', true);
    }
    if (status >= 500) {
      return new LlmError(LlmErrorCodes.SERVICE_UNAVAILABLE, 'Anthropic unavailable', true);
    }
    const body = await response.text();
    return new LlmError(LlmErrorCodes.UNKNOWN, body || 'Anthropic request failed', false);
  }

  private mapError(error: unknown): LlmError {
    if (error instanceof LlmError) {
      return error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      return new LlmError(LlmErrorCodes.TIMEOUT, 'Anthropic request timed out', true);
    }
    return new LlmError(
      LlmErrorCodes.UNKNOWN,
      error instanceof Error ? error.message : 'Anthropic error',
      false,
    );
  }
}
