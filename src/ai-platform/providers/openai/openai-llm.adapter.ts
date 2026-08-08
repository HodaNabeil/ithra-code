import OpenAI from 'openai';
import type { APIError } from 'openai';

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
import { mapOpenAiUsage } from '../../observability/usage';
import { createLinkedAbortController } from '../abort-signal';

export class OpenAILlmAdapter implements LlmPort {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly defaultTemperature: number;
  private readonly defaultMaxTokens: number;
  private readonly requestTimeoutMs: number;

  constructor(apiKey: string, options?: { baseURL?: string; model?: string }) {
    const config = AIPlatformConfig.getLlmConfig();

    this.client = new OpenAI({
      apiKey,
      baseURL: options?.baseURL ?? config.baseURL,
      timeout: config.requestTimeoutMs,
    });
    this.model = options?.model ?? config.model;
    this.defaultTemperature = config.temperature;
    this.defaultMaxTokens = config.maxTokens;
    this.requestTimeoutMs = config.requestTimeoutMs;
  }

  async *streamAnswer(options: LlmStreamOptions): AsyncIterableIterator<string> {
    const { controller, cleanup } = createLinkedAbortController(
      this.requestTimeoutMs,
      options.signal,
    );

    try {
      const stream = await this.client.chat.completions.create(
        {
          model: options.model ?? this.model,
          messages: [
            { role: 'system', content: options.systemPrompt },
            ...this.toOpenAIMessages(options.messages),
          ],
          temperature: options.temperature ?? this.defaultTemperature,
          max_tokens: options.maxTokens ?? this.defaultMaxTokens,
          stream: true,
          stream_options: { include_usage: true },
          tools: options.tools
            ? options.tools.map((tool) => ({
                type: 'function' as const,
                function: {
                  name: tool.name,
                  description: tool.description,
                  parameters: tool.parameters,
                },
              }))
            : undefined,
        },
        { signal: controller.signal },
      );

      for await (const chunk of stream) {
        const usage = chunk.usage;
        if (usage && options.onUsage) {
          const mapped = mapOpenAiUsage(usage);
          options.onUsage({
            input: mapped.inputTokens ?? 0,
            output: mapped.outputTokens ?? 0,
          });
        }

        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === 'AbortError' &&
        options.signal?.aborted
      ) {
        throw new LlmError(
          LlmErrorCodes.INVALID_REQUEST,
          'تم إلغاء الطلب',
          false,
        );
      }
      throw this.mapError(error);
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
      const response = await this.client.chat.completions.create(
        {
          model: options.model ?? this.model,
          messages: [
            { role: 'system', content: options.systemPrompt },
            ...this.toOpenAIMessages(options.messages),
          ],
          temperature: options.temperature ?? this.defaultTemperature,
          max_tokens: options.maxTokens ?? this.defaultMaxTokens,
          response_format:
            options.responseFormat === 'json'
              ? options.jsonSchema
                ? {
                    type: 'json_schema' as const,
                    json_schema: {
                      name: 'structured_output',
                      schema: options.jsonSchema,
                      strict: true,
                    },
                  }
                : { type: 'json_object' as const }
              : undefined,
          tools: options.tools
            ? options.tools.map((tool) => ({
                type: 'function' as const,
                function: {
                  name: tool.name,
                  description: tool.description,
                  parameters: tool.parameters,
                },
              }))
            : undefined,
        },
        { signal: controller.signal },
      );

      const message = response.choices[0]?.message;
      const content = message?.content ?? '';

      const toolCalls = message?.tool_calls?.map((call) => {
        const fn = 'function' in call ? call.function : undefined;
        return {
          id: call.id,
          name: fn?.name ?? '',
          arguments: JSON.parse(fn?.arguments ?? '{}') as Record<string, unknown>,
        };
      });

      const mappedUsage = response.usage
        ? mapOpenAiUsage(response.usage)
        : undefined;

      return {
        content,
        usage: mappedUsage
          ? {
              input: mappedUsage.inputTokens ?? 0,
              output: mappedUsage.outputTokens ?? 0,
            }
          : undefined,
        toolCalls,
      };
    } catch (error) {
      throw this.mapError(error);
    } finally {
      cleanup();
    }
  }

  private toOpenAIMessages(
    messages: LlmMessage[],
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    return messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));
  }

  private mapError(error: unknown): LlmError {
    if (error instanceof LlmError) {
      return error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      return new LlmError(
        LlmErrorCodes.TIMEOUT,
        'انتهت مهلة الاتصال بخدمة الذكاء الاصطناعي',
        true,
      );
    }

    if (error instanceof OpenAI.APIError) {
      return this.mapApiError(error);
    }

    if (error instanceof Error) {
      return new LlmError(LlmErrorCodes.UNKNOWN, error.message, false);
    }

    return new LlmError(LlmErrorCodes.UNKNOWN, 'Unknown LLM error', false);
  }

  private mapApiError(error: APIError): LlmError {
    const status = error.status ?? 500;

    if (status === 401 || status === 403) {
      return new LlmError(
        LlmErrorCodes.AUTHENTICATION_FAILED,
        'فشل التحقق من مفتاح OpenAI',
        false,
      );
    }

    if (status === 429) {
      return new LlmError(
        LlmErrorCodes.RATE_LIMITED,
        'تم تجاوز حد الطلبات. حاول مرة أخرى بعد قليل.',
        true,
      );
    }

    if (status === 408 || error.code === 'ETIMEDOUT') {
      return new LlmError(
        LlmErrorCodes.TIMEOUT,
        'انتهت مهلة الاتصال بخدمة الذكاء الاصطناعي',
        true,
      );
    }

    if (status >= 500) {
      return new LlmError(
        LlmErrorCodes.SERVICE_UNAVAILABLE,
        'خدمة الذكاء الاصطناعي غير متاحة حالياً',
        true,
      );
    }

    if (status === 400) {
      return new LlmError(
        LlmErrorCodes.INVALID_REQUEST,
        error.message || 'طلب غير صالح',
        false,
      );
    }

    return new LlmError(
      LlmErrorCodes.UNKNOWN,
      error.message || 'حدث خطأ غير متوقع',
      false,
    );
  }
}
