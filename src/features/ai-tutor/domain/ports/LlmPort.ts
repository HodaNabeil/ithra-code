/**
 * LlmPort
 *
 * Abstraction for large language model operations.
 * Enables pluggable LLM providers (OpenAI, Claude, etc.)
 *
 * Implementations must handle:
 * - Message streaming
 * - Error handling and retries
 * - Token management
 * - Rate limiting
 */

export interface LlmMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LlmStreamOptions {
  messages: LlmMessage[];
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * LlmPort interface
 * Provides streaming text generation from large language models
 */
export interface LlmPort {
  /**
   * Stream answer from LLM
   * Yields tokens as they are generated from the model
   *
   * @param options - Configuration for the LLM request
   * @returns AsyncIterator yielding individual tokens
   * @throws LlmError if the request fails
   *
   * @example
   * const stream = await llm.streamAnswer({
   *   messages: [{ role: 'user', content: 'What is React?' }],
   *   systemPrompt: 'You are a helpful tutor...'
   * });
   *
   * for await (const token of stream) {
   *   console.log(token); // "React", " is", " a", ...
   * }
   */
  streamAnswer(options: LlmStreamOptions): AsyncIterableIterator<string>;
}

/**
 * LlmError
 * Represents errors from LLM operations
 */
export class LlmError extends Error {
  constructor(
    public code: string,
    message: string,
    public retryable: boolean = false,
  ) {
    super(message);
    this.name = 'LlmError';
  }
}

/**
 * Common LLM error codes
 */
export const LlmErrorCodes = {
  RATE_LIMITED: 'RATE_LIMITED',
  TIMEOUT: 'TIMEOUT',
  INVALID_REQUEST: 'INVALID_REQUEST',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  UNKNOWN: 'UNKNOWN',
} as const;
