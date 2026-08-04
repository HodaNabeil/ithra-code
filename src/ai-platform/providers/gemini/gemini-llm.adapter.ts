import { AIPlatformConfig } from '../../infrastructure/config/ai-platform.config';
import {
  LlmError,
  LlmErrorCodes,
  type LlmCompleteOptions,
  type LlmCompleteResult,
  type LlmPort,
  type LlmStreamOptions,
} from '../../domain/ports/llm.port';

export class GeminiLlmAdapter implements LlmPort {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly defaultTemperature: number;
  private readonly defaultMaxTokens: number;
  private readonly requestTimeoutMs: number;

  constructor(apiKey: string, options?: { model?: string }) {
    const config = AIPlatformConfig.getLlmConfig();
    this.apiKey = apiKey;
    this.model = options?.model ?? 'gemini-2.0-flash';
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
    const model = options.model ?? this.model;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: options.systemPrompt }] },
          contents: options.messages.map((message) => ({
            role: message.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: message.content }],
          })),
          generationConfig: {
            temperature: options.temperature ?? this.defaultTemperature,
            maxOutputTokens: options.maxTokens ?? this.defaultMaxTokens,
            responseMimeType:
              options.responseFormat === 'json' ? 'application/json' : 'text/plain',
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw await this.mapHttpError(response);
      }

      const payload = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };

      const content = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      return { content };
    } catch (error) {
      throw this.mapError(error);
    } finally {
      clearTimeout(timeout);
    }
  }

  private async mapHttpError(response: Response): Promise<LlmError> {
    const status = response.status;
    if (status === 429) {
      return new LlmError(LlmErrorCodes.RATE_LIMITED, 'Gemini rate limited', true);
    }
    if (status >= 500) {
      return new LlmError(LlmErrorCodes.SERVICE_UNAVAILABLE, 'Gemini unavailable', true);
    }
    const body = await response.text();
    return new LlmError(LlmErrorCodes.UNKNOWN, body || 'Gemini request failed', false);
  }

  private mapError(error: unknown): LlmError {
    if (error instanceof LlmError) {
      return error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      return new LlmError(LlmErrorCodes.TIMEOUT, 'Gemini request timed out', true);
    }
    return new LlmError(
      LlmErrorCodes.UNKNOWN,
      error instanceof Error ? error.message : 'Gemini error',
      false,
    );
  }
}
