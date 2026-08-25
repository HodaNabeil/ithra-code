/**
 * EmbeddingPort — text embedding generation for vector search.
 */

export interface EmbeddingOptions {
  model?: string;
}

export interface EmbeddingResult {
  text: string;
  embedding: number[];
  dimensions: number;
  model: string;
  tokensUsed?: number;
}

export interface BatchEmbeddingResult {
  embeddings: EmbeddingResult[];
  totalTokensUsed: number;
}

export interface EmbeddingPort {
  generateEmbedding(
    text: string,
    options?: EmbeddingOptions,
  ): Promise<EmbeddingResult>;
  generateBatchEmbeddings(
    texts: string[],
    options?: EmbeddingOptions,
  ): Promise<BatchEmbeddingResult>;
  getDimensions(): number;
}

export class EmbeddingError extends Error {
  constructor(
    public code: string,
    message: string,
    public retryable: boolean = false,
  ) {
    super(message);
    this.name = 'EmbeddingError';
  }
}

export const EmbeddingErrorCodes = {
  RATE_LIMITED: 'RATE_LIMITED',
  TIMEOUT: 'TIMEOUT',
  INVALID_TEXT: 'INVALID_TEXT',
  MODEL_NOT_FOUND: 'MODEL_NOT_FOUND',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  UNKNOWN: 'UNKNOWN',
} as const;
