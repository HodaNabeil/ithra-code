import OpenAI from 'openai';
import type { APIError } from 'openai';

import { AITutorConfig } from '../config/ai-tutor.config';
import {
  EmbeddingError,
  EmbeddingErrorCodes,
  type BatchEmbeddingResult,
  type EmbeddingOptions,
  type EmbeddingPort,
  type EmbeddingResult,
} from '../../domain/ports/EmbeddingPort';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export class OpenAIEmbeddingAdapter implements EmbeddingPort {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly dimensions: number;

  constructor(apiKey: string, options?: { baseURL?: string; model?: string }) {
    const config = AITutorConfig.getEmbeddingConfig();

    this.client = new OpenAI({
      apiKey,
      baseURL: options?.baseURL ?? config.baseURL,
    });
    this.model = options?.model ?? config.model;
    this.dimensions = config.dimensions;
  }

  async generateEmbedding(
    text: string,
    options?: EmbeddingOptions,
  ): Promise<EmbeddingResult> {
    const batch = await this.generateBatchEmbeddings([text], options);
    const result = batch.embeddings[0];

    if (!result) {
      throw new EmbeddingError(
        EmbeddingErrorCodes.UNKNOWN,
        'فشل توليد التضمين',
        true,
      );
    }

    return result;
  }

  async generateBatchEmbeddings(
    texts: string[],
    options?: EmbeddingOptions,
  ): Promise<BatchEmbeddingResult> {
    if (texts.length === 0) {
      return { embeddings: [], totalTokensUsed: 0 };
    }

    const sanitizedTexts = texts.map((text) => text.trim()).filter(Boolean);
    if (sanitizedTexts.length === 0) {
      throw new EmbeddingError(
        EmbeddingErrorCodes.INVALID_TEXT,
        'لا يوجد نص صالح للتضمين',
        false,
      );
    }

    const model = options?.model ?? this.model;
  let attempt = 0;
  const maxAttempts = 3;

    while (attempt < maxAttempts) {
      attempt += 1;

      try {
        const response = await this.client.embeddings.create({
          model,
          input: sanitizedTexts,
        });

        const embeddings = response.data
          .sort((a, b) => a.index - b.index)
          .map((item) => ({
            text: sanitizedTexts[item.index] ?? '',
            embedding: item.embedding,
            dimensions: item.embedding.length,
            model,
          }));

        return {
          embeddings,
          totalTokensUsed: response.usage?.total_tokens ?? 0,
        };
      } catch (error) {
        const mapped = this.mapError(error);
        if (!mapped.retryable || attempt >= maxAttempts) {
          throw mapped;
        }

        await sleep(2 ** attempt * 500);
      }
    }

    throw new EmbeddingError(
      EmbeddingErrorCodes.UNKNOWN,
      'فشل توليد التضمينات بعد عدة محاولات',
      false,
    );
  }

  getDimensions(): number {
    return this.dimensions;
  }

  private mapError(error: unknown): EmbeddingError {
    if (error instanceof EmbeddingError) {
      return error;
    }

    if (error instanceof OpenAI.APIError) {
      return this.mapApiError(error);
    }

    if (error instanceof Error) {
      return new EmbeddingError(EmbeddingErrorCodes.UNKNOWN, error.message, false);
    }

    return new EmbeddingError(
      EmbeddingErrorCodes.UNKNOWN,
      'حدث خطأ غير متوقع أثناء توليد التضمين',
      false,
    );
  }

  private mapApiError(error: APIError): EmbeddingError {
    const status = error.status ?? 500;

    if (status === 401 || status === 403) {
      return new EmbeddingError(
        EmbeddingErrorCodes.AUTHENTICATION_FAILED,
        'فشل التحقق من مفتاح التضمين',
        false,
      );
    }

    if (status === 429) {
      return new EmbeddingError(
        EmbeddingErrorCodes.RATE_LIMITED,
        'تم تجاوز حد طلبات التضمين',
        true,
      );
    }

    if (status === 408 || error.code === 'ETIMEDOUT') {
      return new EmbeddingError(
        EmbeddingErrorCodes.TIMEOUT,
        'انتهت مهلة خدمة التضمين',
        true,
      );
    }

    if (status >= 500) {
      return new EmbeddingError(
        EmbeddingErrorCodes.SERVICE_UNAVAILABLE,
        'خدمة التضمين غير متاحة حالياً',
        true,
      );
    }

    if (status === 400) {
      return new EmbeddingError(
        EmbeddingErrorCodes.INVALID_TEXT,
        error.message || 'نص غير صالح للتضمين',
        false,
      );
    }

    return new EmbeddingError(
      EmbeddingErrorCodes.UNKNOWN,
      error.message || 'حدث خطأ غير متوقع',
      false,
    );
  }
}
