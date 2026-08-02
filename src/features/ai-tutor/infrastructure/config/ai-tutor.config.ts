/**
 * AI Tutor Configuration
 *
 * Central configuration for AI Tutor feature.
 * Controls feature availability and service configuration.
 */

import { env } from '@/config/env';
import { logger } from '@/lib/logger';

import { AI_TUTOR_CONSTANTS } from '../../shared';

export class AITutorConfig {
  /**
   * Check if AI Tutor feature is enabled
   * Controlled by AI_TUTOR_ENABLED environment variable
   */
  static isEnabled(): boolean {
    return env.AI_TUTOR_ENABLED === 'true';
  }

  /**
   * Get LLM API key (OpenAI or OpenRouter)
   * Throws if not configured when feature is enabled
   */
  static getLlmApiKey(): string {
    if (!this.isEnabled()) {
      throw new Error('AI Tutor feature is disabled');
    }

    const key = env.OPENAI_API_KEY;
    if (!key) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    return key;
  }

  /** @deprecated Use getLlmApiKey */
  static getOpenAIApiKey(): string {
    return this.getLlmApiKey();
  }

  static getLlmBaseUrl(): string | undefined {
    return env.OPENAI_BASE_URL;
  }

  static isOpenRouter(): boolean {
    return this.getLlmBaseUrl()?.includes('openrouter.ai') ?? false;
  }

  /**
   * Get embedding model configuration
   */
  static getEmbeddingConfig() {
    const model = env.AI_TUTOR_EMBEDDING_MODEL
      ?? (this.isOpenRouter() ? 'openai/text-embedding-3-small' : 'text-embedding-3-small');

    return {
      model,
      dimensions: 1536,
      baseURL: env.OPENAI_BASE_URL,
    };
  }

  /**
   * Get LLM model configuration
   */
  static getLlmConfig() {
    return {
      model: env.AI_TUTOR_LLM_MODEL ?? 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: AI_TUTOR_CONSTANTS.MAX_RESPONSE_TOKENS,
      requestTimeoutMs: AI_TUTOR_CONSTANTS.REQUEST_TIMEOUT_MS,
      baseURL: env.OPENAI_BASE_URL,
    };
  }

  /**
   * Get rate limit configuration (per student)
   */
  static getRateLimitConfig() {
    return {
      messagesPerMinute: AI_TUTOR_CONSTANTS.RATE_LIMIT_MESSAGES_PER_MINUTE,
      messagesPerHour: AI_TUTOR_CONSTANTS.RATE_LIMIT_MESSAGES_PER_HOUR,
      messagesPerDay: AI_TUTOR_CONSTANTS.RATE_LIMIT_MESSAGES_PER_DAY,
    };
  }

  /**
   * Get streaming guard configuration (per student)
   */
  static getStreamConfig() {
    return {
      maxConcurrentStreamsPerUser:
        AI_TUTOR_CONSTANTS.MAX_CONCURRENT_STREAMS_PER_USER,
      requestTimeoutMs: AI_TUTOR_CONSTANTS.REQUEST_TIMEOUT_MS,
    };
  }

  /**
   * Get token budget configuration for prompt construction and LLM calls
   */
  static getTokenLimits() {
    return {
      maxPromptTokens: AI_TUTOR_CONSTANTS.MAX_PROMPT_TOKENS,
      maxCompletionTokens: AI_TUTOR_CONSTANTS.MAX_RESPONSE_TOKENS,
    };
  }

  /**
   * Get vector search configuration
   */
  static getVectorSearchConfig() {
    const topK = Number(env.AI_TUTOR_TOP_K);
    const minScore = Number(env.AI_TUTOR_MIN_SIMILARITY);

    return {
      topK:
        Number.isFinite(topK) && topK > 0
          ? Math.min(topK, AI_TUTOR_CONSTANTS.MAX_RETRIEVED_CHUNKS)
          : AI_TUTOR_CONSTANTS.MAX_RETRIEVED_CHUNKS,
      minScore:
        Number.isFinite(minScore) && minScore > 0 && minScore < 1
          ? minScore
          : AI_TUTOR_CONSTANTS.MIN_RELEVANCE_SCORE,
      indexType: 'hnsw' as const,
    };
  }

  /**
   * Get knowledge ingestion / indexing pipeline configuration
   */
  static getIndexingConfig() {
    return {
      chunkMaxChars: AI_TUTOR_CONSTANTS.INDEXING_CHUNK_MAX_CHARS,
      chunkMinChars: AI_TUTOR_CONSTANTS.INDEXING_CHUNK_MIN_CHARS,
      chunkOverlapChars: AI_TUTOR_CONSTANTS.INDEXING_CHUNK_OVERLAP_CHARS,
      maxTokensPerChunk: AI_TUTOR_CONSTANTS.INDEXING_MAX_TOKENS_PER_CHUNK,
      maxPdfBytes: AI_TUTOR_CONSTANTS.INDEXING_MAX_PDF_BYTES,
      maxPdfPages: AI_TUTOR_CONSTANTS.INDEXING_MAX_PDF_PAGES,
      maxTranscriptChars: AI_TUTOR_CONSTANTS.INDEXING_MAX_TRANSCRIPT_CHARS,
      fetchTimeoutMs: AI_TUTOR_CONSTANTS.INDEXING_FETCH_TIMEOUT_MS,
      supportedPdfMimeTypes: ['application/pdf'] as const,
      supportedTextMimeTypes: [
        'text/plain',
        'text/markdown',
        'text/html',
        'text/x-markdown',
      ] as const,
    };
  }

  static getDailyCostCap(): number {
    const cap = Number(env.AI_TUTOR_DAILY_COST_CAP);
    return Number.isFinite(cap) && cap > 0 ? cap : 0;
  }

  static getIndexingWorkerConcurrency(): number {
    const value = Number(env.COURSE_INDEXING_CONCURRENCY);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
  }
}

/**
 * Validate configuration at startup
 */
export function validateAITutorConfig(): void {
  if (!AITutorConfig.isEnabled()) {
    logger.info('[AI_TUTOR_CONFIG] AI Tutor feature is disabled (AI_TUTOR_ENABLED=false)');
    return;
  }

  try {
    AITutorConfig.getLlmApiKey();
    const provider = AITutorConfig.isOpenRouter() ? 'OpenRouter' : 'OpenAI-compatible';
    const embeddingModel = AITutorConfig.getEmbeddingConfig().model;
    const llmModel = AITutorConfig.getLlmConfig().model;
    logger.info(
      { provider, embeddingModel, llmModel },
      '[AI_TUTOR_CONFIG] AI Tutor configuration is valid',
    );
  } catch (error) {
    logger.error({ error }, '[AI_TUTOR_CONFIG] AI Tutor configuration error');
    throw error;
  }
}
