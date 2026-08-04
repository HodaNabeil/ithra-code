import type { LangGraphRunnableConfig } from '@langchain/langgraph';

import type { TutorAgentState } from '../state/tutor-agent.state';

const MAX_RESPONSE_LENGTH = 8000;

export async function validateOutputNode(
  state: TutorAgentState,
  _config: LangGraphRunnableConfig,
): Promise<Partial<TutorAgentState>> {
  const response = state.finalResponse?.trim() ?? '';
  const errors: string[] = [];

  if (!response) {
    errors.push('empty_response');
  }

  if (response.length > MAX_RESPONSE_LENGTH) {
    errors.push('response_too_long');
  }

  return {
    outputValid: errors.length === 0,
    validationErrors: errors,
    finalResponse:
      errors.includes('response_too_long')
        ? response.slice(0, MAX_RESPONSE_LENGTH)
        : response,
  };
}
