import type { LangGraphRunnableConfig } from '@langchain/langgraph';

import type { TutorAgentState } from '../state/tutor-agent.state';
import { sanitizeTutorInput } from './sanitize-input';

export async function sanitizeInputNode(
  state: TutorAgentState,
  _config: LangGraphRunnableConfig,
): Promise<Partial<TutorAgentState>> {
  return {
    sanitizedInput: sanitizeTutorInput(state.input),
  };
}
