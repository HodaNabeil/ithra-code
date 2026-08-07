import type { LlmMessage } from '../../domain/ports/llm.port';
import { AI_PLATFORM_CONSTANTS } from '../../shared/constants';

export function estimateMessageTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function estimateMessagesTokens(messages: LlmMessage[]): number {
  return messages.reduce(
    (total, message) => total + estimateMessageTokens(message.content),
    0,
  );
}

export function getHistoryTokenBudget(): number {
  const fromEnv = process.env.AI_PLATFORM_HISTORY_TOKEN_BUDGET;
  if (fromEnv) {
    const parsed = Number(fromEnv);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.floor(parsed);
    }
  }

  return AI_PLATFORM_CONSTANTS.MAX_PROMPT_TOKENS;
}

export function trimConversationHistory(
  messages: LlmMessage[],
  maxTokens: number,
): LlmMessage[] {
  if (messages.length === 0) {
    return messages;
  }

  const trimmed: LlmMessage[] = [];
  let tokenCount = 0;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]!;
    const messageTokens = estimateMessageTokens(message.content);
    if (tokenCount + messageTokens > maxTokens) {
      break;
    }

    trimmed.unshift(message);
    tokenCount += messageTokens;
  }

  return trimmed.length > 0 ? trimmed : messages.slice(-1);
}
