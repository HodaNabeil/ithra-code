import type { LangGraphRunnableConfig } from '@langchain/langgraph';

import { getGraphRuntimeConfig } from '../runtime-config';
import type { TutorAgentState } from '../state/tutor-agent.state';

/**
 * Loads short-term conversation history from ai-platform's own
 * ConversationMemoryPort when the caller didn't already supply history via
 * run metadata. This makes runAgent('tutor') remember prior turns even for
 * callers that don't own a durable conversation store themselves.
 */
export async function loadHistoryNode(
  state: TutorAgentState,
  config: LangGraphRunnableConfig,
): Promise<Partial<TutorAgentState>> {
  const runtime = getGraphRuntimeConfig(config);

  if (
    state.conversationHistory.length > 0 ||
    !runtime.threadId ||
    !runtime.conversationMemoryPort
  ) {
    return {};
  }

  const history = await runtime.conversationMemoryPort.getHistory(
    runtime.threadId,
  );
  return { conversationHistory: history };
}
