import OpenAI from 'openai';
import type { APIError } from 'openai';

import { AITutorConfig } from '../config/ai-tutor.config';
import {
  LlmError,
  LlmErrorCodes,
  type LlmMessage,
  type LlmPort,
  type LlmStreamOptions,
} from '../../domain/ports/LlmPort';

export class OpenAILlmAdapter implements LlmPort {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly defaultTemperature: number;
  private readonly defaultMaxTokens: number;

  constructor(apiKey: string, options?: { baseURL?: string; model?: string }) {
    const config = AITutorConfig.getLlmConfig();

    this.client = new OpenAI({
      apiKey,
      baseURL: options?.baseURL ?? config.baseURL,
    });
    this.model = options?.model ?? config.model;
    this.defaultTemperature = config.temperature;
    this.defaultMaxTokens = config.maxTokens;
  }

  async *streamAnswer(options: LlmStreamOptions): AsyncIterableIterator<string> {
    try {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: options.systemPrompt },
          ...this.toOpenAIMessages(options.messages),
        ],
        temperature: options.temperature ?? this.defaultTemperature,
        max_tokens: options.maxTokens ?? this.defaultMaxTokens,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      throw this.mapError(error);
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
