import type { LlmMessage } from './llm.port';

/**
 * ConversationMemoryPort — short-term, thread-scoped turn history owned by
 * ai-platform itself. This lets runAgent('tutor') work standalone (without a
 * feature-layer conversation repository) while still remembering prior turns
 * within a thread. Callers that already manage their own durable persistence
 * (e.g. src/features/ai-tutor's Prisma-backed repository) may still supply
 * `conversationHistory` directly via run metadata — this port is only
 * consulted when no history was supplied and a threadId is present.
 */
export interface ConversationMemoryPort {
  getHistory(threadId: string, limit?: number): Promise<LlmMessage[]>;
  appendTurn(
    threadId: string,
    turn: { userContent: string; assistantContent: string },
  ): Promise<void>;
  clear(threadId: string): Promise<void>;
}
