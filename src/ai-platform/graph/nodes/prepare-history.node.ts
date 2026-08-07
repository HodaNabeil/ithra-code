import type { LangGraphRunnableConfig } from '@langchain/langgraph';

import {
  getHistoryTokenBudget,
  trimConversationHistory,
} from '../../domain/policies/token-budget.policy';
import { summarizeConversationIfNeeded } from '../../memory/summarizer/context-summarizer';
import { getGraphRuntimeConfig } from '../runtime-config';
import type { TutorAgentState } from '../state/tutor-agent.state';

export async function prepareHistoryNode(
  state: TutorAgentState,
  config: LangGraphRunnableConfig,
): Promise<Partial<TutorAgentState>> {
  const runtime = getGraphRuntimeConfig(config);
  const maxTokens = getHistoryTokenBudget();

  if (state.conversationHistory.length === 0) {
    return {};
  }

  const trimmed = trimConversationHistory(state.conversationHistory, maxTokens);

  const summarized = await summarizeConversationIfNeeded(runtime.llmPort, {
    messages: trimmed,
    locale: state.locale,
    maxTokens,
  });

  return {
    conversationHistory: summarized.messages,
  };
}
