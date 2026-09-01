/**
 * AI Tutor Shared Utilities
 *
 * Shared constants, types, and utilities for AI Tutor.
 *
 * Contents:
 * - Type definitions used across layers
 * - Constants (error messages, limits, etc.)
 * - Helper functions
 * - Query keys for React Query
 * - Validators
 */

// Shared utilities will be implemented as needed through sprints

/**
 * Common constants
 */
export const AI_TUTOR_CONSTANTS = {
  // Feature names
  FEATURE_NAME: 'AI_TUTOR',

  // API endpoints
  API_BASE_PATH: '/api/tutor',
  THREADS_ENDPOINT: '/api/tutor/threads',

  // Message limits
  MAX_MESSAGE_LENGTH: 5000,
  MIN_MESSAGE_LENGTH: 1,

  // Response limits
  MAX_RESPONSE_LENGTH: 5000,
  REQUEST_TIMEOUT_MS: 60_000,
  MAX_PROMPT_TOKENS: 8000,
  MAX_RESPONSE_TOKENS: 402,
  MAX_CONCURRENT_STREAMS_PER_USER: 2,

  // Context cache (Redis, 5 min TTL)
  CONTEXT_CACHE_TTL_MS: 5 * 60 * 1000,
  CONTEXT_CACHE_KEY_PREFIX: 'tutor:session-context:v2',

  // Content limits
  MAX_RETRIEVED_CHUNKS: 10,
  MIN_RELEVANCE_SCORE: 0.25,
  CHUNK_MAX_CHARS: 1000,
  CHUNK_MIN_CHARS: 100,
  CHUNK_OVERLAP_CHARS: 100,

  // Rate limiting (per student)
  RATE_LIMIT_MESSAGES_PER_MINUTE: 30,
  RATE_LIMIT_MESSAGES_PER_HOUR: 300,
  RATE_LIMIT_MESSAGES_PER_DAY: 1000,

  // Conversation
  CONVERSATION_HISTORY_LIMIT: 20,
  MAX_THREADS_PER_CONVERSATION: 100,

  // Vector embeddings
  EMBEDDING_DIMENSIONS: 1536,
  EMBEDDING_BATCH_SIZE: 25,

  // Knowledge ingestion / indexing
  INDEXING_CHUNK_MAX_CHARS: 1000,
  INDEXING_CHUNK_MIN_CHARS: 100,
  INDEXING_CHUNK_OVERLAP_CHARS: 100,
  INDEXING_MAX_TOKENS_PER_CHUNK: 512,
  INDEXING_MAX_PDF_BYTES: 12 * 1024 * 1024,
  INDEXING_MAX_PDF_PAGES: 200,
  INDEXING_MAX_TRANSCRIPT_CHARS: 500_000,
  INDEXING_FETCH_TIMEOUT_MS: 20_000,

  // Indexing API
  INDEX_ENDPOINT: '/api/tutor/index',
} as const;

export { isLikelyEnglish } from './language';
export {
  encodeSseDataLine,
  encodeTutorSseEvent,
  parseTutorSseEvent,
  type TutorSseEvent,
} from './sse-protocol';
export {
  detectAssessmentIntent,
  validateEducationalResponse,
  buildGuidedLearningResponse,
  transformAnswerToGuidance,
  buildAssessmentFallbackSuggestions,
} from './educational-integrity-rules';
export type {
  AssessmentIntent,
  ResponseIntegrityResult,
} from './educational-integrity-rules';
