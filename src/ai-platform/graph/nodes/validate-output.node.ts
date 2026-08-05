import type { LangGraphRunnableConfig } from '@langchain/langgraph';

import { buildGuidedLearningResponse, validateEducationalResponse } from './guards/educational-integrity';
import type { TutorAgentState } from '../state/tutor-agent.state';

const MAX_RESPONSE_LENGTH = 8000;

export async function validateOutputNode(
  state: TutorAgentState,
  _config: LangGraphRunnableConfig,
): Promise<Partial<TutorAgentState>> {
  let response = state.finalResponse?.trim() ?? '';
  const errors: string[] = [];

  if (!response) {
    errors.push('empty_response');
  }

  if (response.length > MAX_RESPONSE_LENGTH) {
    errors.push('response_too_long');
    response = response.slice(0, MAX_RESPONSE_LENGTH);
  }

  const hardFailure = errors.length > 0;

  // Skip the leak check for already-blocked assessment responses — they are
  // our own guided-learning message, not LLM output that might leak answers.
  // A leak is corrected in place (not a hard failure) since we replace the
  // response with a safe guided-learning message before returning it.
  if (response && !state.assessmentBlocked) {
    const integrity = validateEducationalResponse(response);
    if (!integrity.isValid) {
      errors.push('assessment_leak');
      response = buildGuidedLearningResponse(state.sanitizedInput || state.input);
    }
  }

  return {
    outputValid: !hardFailure,
    validationErrors: errors,
    finalResponse: response,
  };
}
