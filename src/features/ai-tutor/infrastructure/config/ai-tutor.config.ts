/**
 * AI Tutor Configuration
 *
 * Central configuration for AI Tutor feature.
 * Controls feature availability and service configuration.
 */

import { env } from '@/config/env';

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
      maxTokens: 2048,
      baseURL: env.OPENAI_BASE_URL,
    };
  }

  /**
   * Get rate limit configuration (per student)
   */
  static getRateLimitConfig() {
    return {
      messagesPerMinute: 30,
      messagesPerHour: 300,
      messagesPerDay: 5000,
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
}

/**
 * Validate configuration at startup
 */
export function validateAITutorConfig(): void {
  if (!AITutorConfig.isEnabled()) {
    console.log('ℹ AI Tutor feature is disabled (AI_TUTOR_ENABLED=false)');
    return;
  }

  try {
    AITutorConfig.getLlmApiKey();
    const provider = AITutorConfig.isOpenRouter() ? 'OpenRouter' : 'OpenAI-compatible';
    console.log(`✓ AI Tutor configuration is valid (${provider})`);
  } catch (error) {
    console.error('✗ AI Tutor configuration error:', error);
    throw error;
  }
}
