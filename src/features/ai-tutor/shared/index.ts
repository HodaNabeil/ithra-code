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
  MAX_RESPONSE_TIME_MS: 30000,
  MAX_PROMPT_TOKENS: 4096,
  MAX_RESPONSE_TOKENS: 2048,

  // Context cache (Redis, 5 min TTL)
  CONTEXT_CACHE_TTL_MS: 5 * 60 * 1000,
  CONTEXT_CACHE_KEY_PREFIX: 'tutor:session-context:v1',
  
  // Content limits
  MAX_RETRIEVED_CHUNKS: 10,
  MIN_RELEVANCE_SCORE: 0.7,
  CHUNK_MAX_CHARS: 1000,
  CHUNK_MIN_CHARS: 100,
  CHUNK_OVERLAP_CHARS: 100,
  
  // Rate limiting (per student)
  RATE_LIMIT_MESSAGES_PER_MINUTE: 30,
  RATE_LIMIT_MESSAGES_PER_HOUR: 300,
  RATE_LIMIT_MESSAGES_PER_DAY: 5000,
  
  // Conversation
  CONVERSATION_HISTORY_LIMIT: 20,
  MAX_THREADS_PER_CONVERSATION: 100,
  
  // Vector embeddings
  EMBEDDING_DIMENSIONS: 1536,
  EMBEDDING_BATCH_SIZE: 25,

  // Indexing API
  INDEX_ENDPOINT: '/api/tutor/index',

  // Streaming protocol
  SSE_META_PREFIX: '[META]',
} as const;

export { isLikelyEnglish } from './language';
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
