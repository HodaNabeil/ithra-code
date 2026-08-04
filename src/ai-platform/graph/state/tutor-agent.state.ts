import { Annotation } from '@langchain/langgraph';

import type { LlmMessage } from '../../domain/ports/llm.port';

export interface RetrievedChunkState {
  id: string;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface TutorAgentState {
  agentId: string;
  userId: string;
  input: string;
  locale: 'ar' | 'en';
  systemPrompt: string;
  conversationHistory: LlmMessage[];
  retrievedChunks: RetrievedChunkState[];
  sanitizedInput: string;
  finalResponse: string;
  outputValid: boolean;
  validationErrors: string[];
  tokensUsed: { input: number; output: number };
  pendingToolCalls: Array<{ id: string; name: string; arguments: Record<string, unknown> }>;
  toolResults: Array<{ toolCallId: string; output: Record<string, unknown> }>;
  toolIterations: number;
}

export const TutorAgentStateAnnotation = Annotation.Root({
  agentId: Annotation<string>,
  userId: Annotation<string>,
  input: Annotation<string>,
  locale: Annotation<'ar' | 'en'>,
  systemPrompt: Annotation<string>,
  conversationHistory: Annotation<LlmMessage[]>({
    reducer: (_left, right) => right,
    default: () => [],
  }),
  retrievedChunks: Annotation<RetrievedChunkState[]>({
    reducer: (_left, right) => right,
    default: () => [],
  }),
  sanitizedInput: Annotation<string>,
  finalResponse: Annotation<string>,
  outputValid: Annotation<boolean>,
  validationErrors: Annotation<string[]>({
    reducer: (_left, right) => right,
    default: () => [],
  }),
  tokensUsed: Annotation<{ input: number; output: number }>({
    reducer: (_left, right) => right,
    default: () => ({ input: 0, output: 0 }),
  }),
  pendingToolCalls: Annotation<
    Array<{ id: string; name: string; arguments: Record<string, unknown> }>
  >({
    reducer: (_left, right) => right,
    default: () => [],
  }),
  toolResults: Annotation<Array<{ toolCallId: string; output: Record<string, unknown> }>>({
    reducer: (left, right) => [...left, ...right],
    default: () => [],
  }),
  toolIterations: Annotation<number>({
    reducer: (_left, right) => right,
    default: () => 0,
  }),
});
