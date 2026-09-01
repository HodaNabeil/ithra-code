/**
 * AI Tutor Configuration
 *
 * Central configuration for AI Tutor feature.
 * Controls feature availability and indexing configuration.
 * LLM, embedding, RAG, guards, and runtime execution are owned by ai-platform.
 */

import { env } from '@/config/env';
import { logger } from '@/lib/logger';
import {
  validateAIPlatformConfig,
  AIPlatformConfig,
} from '@/ai-platform/infrastructure/config/ai-platform.config';

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
   * Get token budget configuration for conversation history trimming
   */
  static getTokenLimits() {
    return {
      maxPromptTokens: AI_TUTOR_CONSTANTS.MAX_PROMPT_TOKENS,
      maxCompletionTokens: AI_TUTOR_CONSTANTS.MAX_RESPONSE_TOKENS,
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

  static getIndexingWorkerConcurrency(): number {
    const value = Number(env.COURSE_INDEXING_CONCURRENCY);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
  }
}

let tutorConfigValidated = false;

export function resetAITutorConfigValidationForTests(): void {
  tutorConfigValidated = false;
}

/**
 * Validate configuration at startup
 */
export function validateAITutorConfig(): void {
  if (!AITutorConfig.isEnabled()) {
    if (!tutorConfigValidated) {
      logger.info(
        '[AI_TUTOR_CONFIG] AI Tutor feature is disabled (AI_TUTOR_ENABLED=false)',
      );
      tutorConfigValidated = true;
    }
    return;
  }

  if (tutorConfigValidated) {
    return;
  }

  if (!AIPlatformConfig.isEnabled()) {
    throw new Error(
      'AI Tutor requires AI Platform. Set AI_PLATFORM_ENABLED=true.',
    );
  }

  try {
    validateAIPlatformConfig();
    const llm = AIPlatformConfig.getLlmConfig();
    const embedding = AIPlatformConfig.getEmbeddingConfig();
    logger.info(
      {
        llmModel: llm.model,
        embeddingModel: embedding.model,
      },
      '[AI_TUTOR_CONFIG] AI Tutor configuration is valid',
    );
    tutorConfigValidated = true;
  } catch (error) {
    logger.error({ error }, '[AI_TUTOR_CONFIG] AI Tutor configuration error');
    throw error;
  }
}
