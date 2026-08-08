import type { MessageDTO } from '../../domain/ports/ConversationRepositoryPort';
import { resolvePromptSync } from '@/ai-platform/prompts/resolver';
import { AI_TUTOR_CONSTANTS } from '../../shared';

/**
 * Feature-owned prompt-building has moved into ai-platform
 * (`tutor-system-prompt.builder.ts`), which owns rendering session/RAG
 * context into the final system prompt text. This module now only exposes
 * the prompt version (for cost/observability metadata) and a generic
 * conversation-history trimming utility.
 */
export function getTutorBasePromptVersion(): string {
  return resolvePromptSync('tutor/system', 'ar').version;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function trimConversationHistory(
  history: MessageDTO[],
  systemPrompt: string,
): MessageDTO[] {
  const maxPromptTokens = AI_TUTOR_CONSTANTS.MAX_PROMPT_TOKENS;
  const reservedResponseTokens = AI_TUTOR_CONSTANTS.MAX_RESPONSE_TOKENS;
  const systemTokens = estimateTokens(systemPrompt);
  const availableTokens = maxPromptTokens - systemTokens - reservedResponseTokens;

  if (availableTokens <= 0 || history.length === 0) {
    return history.slice(-2);
  }

  const trimmed: MessageDTO[] = [];
  let usedTokens = 0;

  for (let index = history.length - 1; index >= 0; index -= 1) {
    const message = history[index];
    if (!message) {
      continue;
    }

    const messageTokens = estimateTokens(message.content);

    if (usedTokens + messageTokens > availableTokens) {
      break;
    }

    trimmed.unshift(message);
    usedTokens += messageTokens;
  }

  return trimmed.length > 0 ? trimmed : history.slice(-2);
}
