/**
 * AI Tutor Feature - Main Export
 *
 * Public API for feature flag and configuration.
 * Use cases and handlers are wired through ai-tutor-container.
 */

export {
  AITutorConfig,
  validateAITutorConfig,
} from './infrastructure/config/ai-tutor.config';
export { AI_TUTOR_CONSTANTS } from './shared';
export * from './domain/ports';
