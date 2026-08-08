/**
 * ConversationRepositoryPort
 *
 * Abstraction for conversation persistence.
 * Handles storage and retrieval of conversations, threads, and messages.
 *
 * Implementations must handle:
 * - CRUD operations
 * - Transaction support
 * - Query efficiency
 * - Data consistency
 */

export interface ConversationDTO {
  id: string;
  courseId: string;
  userId: string;
  threads: ThreadDTO[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ThreadDTO {
  id: string;
  conversationId: string;
  lectureId?: string;
  topic: string;
  messages: MessageDTO[];
  createdAt: Date;
  updatedAt: Date;
}

import type { MessageSourceDTO } from '../models/MessageSource';

export type MessageStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface MessageDTO {
  id: string;
  threadId: string;
  role: 'user' | 'assistant';
  content: string;
  status?: MessageStatus;
  turnId?: string;
  retrievedSources?: MessageSourceDTO[];
  createdAt: Date;
  updatedAt: Date;
}

export type TurnHandle = {
  turnId: string;
  userMessageId: string;
  assistantMessageId: string;
};

export type IdempotencyRecord = {
  id: string;
  userId: string;
  idempotencyKey: string;
  threadId: string;
  turnId: string | null;
  status: 'processing' | 'completed' | 'failed';
};

export interface ConversationRepositoryPort {
  /**
   * Get or create conversation for a course/user pair
   * Ensures exactly one conversation per course per student
   *
   * @param courseId - Course ID
   * @param userId - User ID
   * @returns Existing or newly created conversation
   */
  getOrCreateConversation(courseId: string, userId: string): Promise<ConversationDTO>;

  /**
   * Get existing conversation
   *
   * @param conversationId - Conversation ID
   * @returns Conversation or null if not found
   */
  getConversation(conversationId: string): Promise<ConversationDTO | null>;

  /**
   * Get all conversations for a user
   *
   * @param userId - User ID
   * @returns List of conversations
   */
  getUserConversations(userId: string): Promise<ConversationDTO[]>;

  /**
   * Get or create thread within a conversation
   *
   * @param conversationId - Conversation ID
   * @param lectureId - Lecture ID (optional, for automatic naming)
   * @param topic - Thread topic/name
   * @returns Existing or newly created thread
   */
  getOrCreateThread(
    conversationId: string,
    topic: string,
    lectureId?: string,
  ): Promise<ThreadDTO>;

  /**
   * Persist a user/assistant turn atomically.
   */
  persistTurn(
    threadId: string,
    params: {
      userContent: string;
      assistantContent: string;
      retrievedSources?: MessageSourceDTO[];
    },
  ): Promise<{ userMessage: MessageDTO; assistantMessage: MessageDTO }>;

  /**
   * Find conversation for a course/user pair without creating.
   */
  findConversation(courseId: string, userId: string): Promise<ConversationDTO | null>;

  /**
   * Find thread within a conversation without creating.
   */
  findThread(
    conversationId: string,
    params: { lectureId?: string; topic?: string },
  ): Promise<ThreadDTO | null>;

  /**
   * Get thread messages (recent)
   *
   * @param threadId - Thread ID
   * @param limit - Max messages to return (default: 20)
   * @returns Recent messages in thread
   */
  getThreadMessages(threadId: string, limit?: number): Promise<MessageDTO[]>;

  getThreadMessagesPaginated(
    threadId: string,
    params: { before?: string; limit?: number },
  ): Promise<{
    messages: MessageDTO[];
    nextCursor: string | null;
  }>;

  beginTurn(
    threadId: string,
    params: { userContent: string; turnId?: string },
  ): Promise<TurnHandle>;

  completeTurn(
    turnId: string,
    params: {
      assistantContent: string;
      retrievedSources?: MessageDTO['retrievedSources'];
    },
  ): Promise<void>;

  failTurn(
    turnId: string,
    status?: 'failed' | 'cancelled',
  ): Promise<void>;

  claimIdempotencyKey(params: {
    userId: string;
    idempotencyKey: string;
    threadId: string;
  }): Promise<
    | { kind: 'created'; recordId: string }
    | { kind: 'replay'; record: IdempotencyRecord }
    | { kind: 'conflict' }
  >;

  completeIdempotencyKey(params: {
    userId: string;
    idempotencyKey: string;
    turnId: string;
  }): Promise<void>;

  failIdempotencyKey(params: {
    userId: string;
    idempotencyKey: string;
  }): Promise<void>;

  /**
   * Add message to thread
   *
   * @param threadId - Thread ID
   * @param message - Message to add
   * @returns Saved message with ID
   */
  addMessage(threadId: string, message: Omit<MessageDTO, 'id' | 'createdAt' | 'updatedAt'>): Promise<MessageDTO>;

  /**
   * Get message by ID
   *
   * @param messageId - Message ID
   * @returns Message or null if not found
   */
  getMessage(messageId: string): Promise<MessageDTO | null>;

  /**
   * Update message (for editing)
   *
   * @param messageId - Message ID
   * @param content - New content
   * @throws Error if message not found
   */
  updateMessage(messageId: string, content: string): Promise<MessageDTO>;

  /**
   * Delete message
   *
   * @param messageId - Message ID
   * @returns True if deleted, false if not found
   */
  deleteMessage(messageId: string): Promise<boolean>;

  /**
   * Delete entire conversation
   *
   * @param conversationId - Conversation ID
   * @returns True if deleted, false if not found
   */
  deleteConversation(conversationId: string): Promise<boolean>;

  /**
   * Search messages within a conversation
   *
   * @param conversationId - Conversation ID
   * @param query - Search text
   * @returns Matching messages
   */
  searchMessages(conversationId: string, query: string): Promise<MessageDTO[]>;

  /**
   * Get conversation statistics
   *
   * @param conversationId - Conversation ID
   * @returns Stats about the conversation
   */
  getConversationStats(conversationId: string): Promise<{
    threadCount: number;
    messageCount: number;
    lastMessageAt: Date | null;
  }>;
}

/**
 * ConversationRepositoryError
 * Represents errors from conversation repository operations
 */
export class ConversationRepositoryError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ConversationRepositoryError';
  }
}

/**
 * Common repository error codes
 */
export const ConversationRepositoryErrorCodes = {
  NOT_FOUND: 'NOT_FOUND',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INVALID_DATA: 'INVALID_DATA',
  UNKNOWN: 'UNKNOWN',
} as const;
