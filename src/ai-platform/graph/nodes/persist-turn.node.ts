import type { LangGraphRunnableConfig } from '@langchain/langgraph';

import { getGraphRuntimeConfig } from '../runtime-config';
import type { TutorAgentState } from '../state/tutor-agent.state';

/**
 * Appends the completed turn to ai-platform's own ConversationMemoryPort, so
 * future runs against the same threadId see this turn — independent of any
 * durable persistence a caller (e.g. src/features/ai-tutor) also performs.
 */
export async function persistTurnNode(
  state: TutorAgentState,
  config: LangGraphRunnableConfig,
): Promise<Partial<TutorAgentState>> {
  const runtime = getGraphRuntimeConfig(config);

  if (
    !runtime.threadId ||
    !runtime.conversationMemoryPort ||
    !state.finalResponse
  ) {
    return {};
  }

  await runtime.conversationMemoryPort.appendTurn(runtime.threadId, {
    userContent: state.sanitizedInput || state.input,
    assistantContent: state.finalResponse,
  });

  return {};
}
