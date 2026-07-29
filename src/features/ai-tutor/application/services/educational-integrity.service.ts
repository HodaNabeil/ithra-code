/**
 * Educational integrity helpers (application facade over shared rules).
 */
export {
  detectAssessmentIntent,
  validateEducationalResponse,
  buildGuidedLearningResponse,
  transformAnswerToGuidance,
  buildAssessmentFallbackSuggestions,
} from '../../shared/educational-integrity-rules';
export type {
  AssessmentIntent,
  ResponseIntegrityResult,
} from '../../shared/educational-integrity-rules';
