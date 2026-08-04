import type { LangGraphRunnableConfig } from '@langchain/langgraph';

import type { TutorAgentState } from '../state/tutor-agent.state';

/**
 * Retrieval is pre-fetched by ContextBuilder when retrievalMode is eager.
 * This node is a pass-through that preserves chunks already in state.
 */
export async function retrieveContextNode(
  state: TutorAgentState,
  _config: LangGraphRunnableConfig,
): Promise<Partial<TutorAgentState>> {
  return {
    retrievedChunks: state.retrievedChunks ?? [],
  };
}
