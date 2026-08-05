/**
 * Shared utility types for the AI Platform public API.
 */

export type ChatMessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  role: ChatMessageRole;
  content: string;
}

export interface ChatScope {
  userId: string;
  courseId?: string;
  lectureId?: string;
  [key: string]: string | undefined;
}

export interface ChatOptions {
  locale?: string;
  threadId?: string;
  conversationId?: string;
}

export interface ChatUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
}

export interface RetrievedSource {
  id: string;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface ChatResult {
  runId: string;
  content: string;
  usage?: ChatUsage;
  sources?: RetrievedSource[];
}

export type ChatStreamEvent =
  | { type: 'meta'; runId: string; sources?: RetrievedSource[]; usedFallback?: boolean }
  | { type: 'token'; text: string }
  | { type: 'replace'; text: string }
  | {
      type: 'done';
      usage?: ChatUsage;
      output?: string;
      metadata?: Record<string, unknown>;
    }
  | { type: 'error'; code: string; message: string; retryable?: boolean };
