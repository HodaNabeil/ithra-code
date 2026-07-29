/**
 * EmbeddingPort
 *
 * Abstraction for text embedding generation.
 * Converts text into vector representations for similarity search.
 *
 * Implementations must handle:
 * - Embedding generation
 * - Batch processing
 * - Vector normalization
 * - Error handling and retries
 */

export interface EmbeddingOptions {
  /**
   * Model to use for embedding generation
   * e.g., "text-embedding-3-small", "text-embedding-3-large"
   */
  model?: string;
}

export interface EmbeddingResult {
  text: string;
  embedding: number[];
  dimensions: number;
  model: string;
}

export interface BatchEmbeddingResult {
  embeddings: EmbeddingResult[];
  totalTokensUsed: number;
}

/**
 * EmbeddingPort interface
 * Provides text embedding functionality
 */
export interface EmbeddingPort {
  /**
   * Generate embedding for a single text
   *
   * @param text - Text to embed
   * @param options - Configuration for embedding
   * @returns Embedding result with vector
   * @throws EmbeddingError if generation fails
   *
   * @example
   * const result = await embeddings.generateEmbedding(
   *   'What is React?',
   *   { model: 'text-embedding-3-small' }
   * );
   * console.log(result.embedding); // [0.123, -0.456, ...]
   */
  generateEmbedding(text: string, options?: EmbeddingOptions): Promise<EmbeddingResult>;

  /**
   * Generate embeddings for multiple texts in batch
   * More efficient than individual calls
   *
   * @param texts - Texts to embed
   * @param options - Configuration for embedding
   * @returns Batch results
   * @throws EmbeddingError if generation fails
   *
   * @example
   * const results = await embeddings.generateBatchEmbeddings([
   *   'React is a library',
   *   'JSX is syntax',
   *   'Hooks are functions'
   * ]);
   */
  generateBatchEmbeddings(texts: string[], options?: EmbeddingOptions): Promise<BatchEmbeddingResult>;

  /**
   * Get configured embedding dimension
   * Usually 1536 for OpenAI's text-embedding-3-small
   *
   * @returns Number of dimensions in embedding vectors
   */
  getDimensions(): number;
}

/**
 * EmbeddingError
 * Represents errors from embedding operations
 */
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

/**
 * Common embedding error codes
 */
export const EmbeddingErrorCodes = {
  RATE_LIMITED: 'RATE_LIMITED',
  TIMEOUT: 'TIMEOUT',
  INVALID_TEXT: 'INVALID_TEXT',
  MODEL_NOT_FOUND: 'MODEL_NOT_FOUND',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  UNKNOWN: 'UNKNOWN',
} as const;
