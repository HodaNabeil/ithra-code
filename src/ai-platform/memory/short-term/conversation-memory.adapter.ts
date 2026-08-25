import type { ConversationMemoryPort } from '../../domain/ports/conversation-memory.port';
import type { LlmMessage } from '../../domain/ports/llm.port';
import { AI_PLATFORM_CONSTANTS } from '../../shared/constants';

async function getRedisClient() {
  const { redis } = await import('@/lib/redis');
  return redis;
}

/**
 * Redis-backed ConversationMemoryPort. Stores a bounded, per-thread turn list
 * as JSON with a rolling TTL. Non-critical: any Redis failure degrades to an
 * empty history / no-op append rather than failing the agent run.
 */
export class RedisConversationMemoryAdapter implements ConversationMemoryPort {
  private key(threadId: string): string {
    return `${AI_PLATFORM_CONSTANTS.KEY_PREFIX_CONVERSATION}${threadId}`;
  }

  async getHistory(
    threadId: string,
    limit = AI_PLATFORM_CONSTANTS.CONVERSATION_MEMORY_TURN_LIMIT,
  ): Promise<LlmMessage[]> {
    try {
      const redis = await getRedisClient();
      const raw = await redis.get(this.key(threadId));
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as LlmMessage[];
      return parsed.slice(-limit);
    } catch {
      return [];
    }
  }

  async appendTurn(
    threadId: string,
    turn: { userContent: string; assistantContent: string },
  ): Promise<void> {
    try {
      const redis = await getRedisClient();
      const existing = await this.getHistory(
        threadId,
        AI_PLATFORM_CONSTANTS.CONVERSATION_MEMORY_TURN_LIMIT,
      );
      const updated: LlmMessage[] = [
        ...existing,
        { role: 'user' as const, content: turn.userContent },
        { role: 'assistant' as const, content: turn.assistantContent },
      ].slice(-AI_PLATFORM_CONSTANTS.CONVERSATION_MEMORY_TURN_LIMIT);

      await redis.set(
        this.key(threadId),
        JSON.stringify(updated),
        'EX',
        AI_PLATFORM_CONSTANTS.CONVERSATION_MEMORY_TTL_SECONDS,
      );
    } catch {
      // Non-critical cache — losing short-term memory shouldn't fail the run.
    }
  }

  async clear(threadId: string): Promise<void> {
    try {
      const redis = await getRedisClient();
      await redis.del(this.key(threadId));
    } catch {
      // Non-critical.
    }
  }
}

export const redisConversationMemoryAdapter =
  new RedisConversationMemoryAdapter();
