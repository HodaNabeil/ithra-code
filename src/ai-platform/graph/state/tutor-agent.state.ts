import { Annotation } from '@langchain/langgraph';

import type { LlmMessage } from '../../domain/ports/llm.port';
import type { RetrievalStrategy } from '../../rag/retrieval/types';
import {
  agentExecutionChannels,
  type AgentExecutionState,
} from './shared-channels';

export interface RetrievedChunkState {
  id: string;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
}

/**
 * Optional, feature-supplied personalization facts (student/course/progress).
 * Plain data only — ai-platform owns formatting/rendering of these facts into
 * the final system prompt (see prompts/tutor-system-prompt.builder.ts).
 */
export interface TutorPersonalizationContext {
  studentName?: string;
  learningLevel?: string;
  courseTitle?: string;
  lectureTitle?: string;
  progressPercent?: number;
  knowledgeGaps?: string[];
  sessionMetaMode?: boolean;
}

export interface TutorAgentState extends AgentExecutionState {
  agentId: string;
  userId: string;
  input: string;
  locale: 'ar' | 'en';
  systemPrompt: string;
  personalization?: TutorPersonalizationContext;
  conversationHistory: LlmMessage[];
  retrievedChunks: RetrievedChunkState[];
  sanitizedInput: string;
  assessmentBlocked: boolean;
  groundingBlocked: boolean;
  retrievalStrategy?: RetrievalStrategy;
  outputValid: boolean;
  pendingToolCalls: Array<{
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  }>;
  toolResults: Array<{ toolCallId: string; output: Record<string, unknown> }>;
  toolIterations: number;
}

export const TutorAgentStateAnnotation = Annotation.Root({
  agentId: Annotation<string>,
  userId: Annotation<string>,
  input: Annotation<string>,
  locale: Annotation<'ar' | 'en'>,
  systemPrompt: Annotation<string>,
  personalization: Annotation<TutorPersonalizationContext | undefined>({
    reducer: (_left, right) => right,
    default: () => undefined,
  }),
  conversationHistory: Annotation<LlmMessage[]>({
    reducer: (_left, right) => right,
    default: () => [],
  }),
  retrievedChunks: Annotation<RetrievedChunkState[]>({
    reducer: (_left, right) => right,
    default: () => [],
  }),
  sanitizedInput: Annotation<string>,
  assessmentBlocked: Annotation<boolean>({
    reducer: (_left, right) => right,
    default: () => false,
  }),
  groundingBlocked: Annotation<boolean>({
    reducer: (_left, right) => right,
    default: () => false,
  }),
  retrievalStrategy: Annotation<RetrievalStrategy | undefined>({
    reducer: (_left, right) => right,
    default: () => undefined,
  }),
  finalResponse: Annotation<string>,
  outputValid: Annotation<boolean>,
  ...agentExecutionChannels,
  pendingToolCalls: Annotation<
    Array<{ id: string; name: string; arguments: Record<string, unknown> }>
  >({
    reducer: (_left, right) => right,
    default: () => [],
  }),
  toolResults: Annotation<
    Array<{ toolCallId: string; output: Record<string, unknown> }>
  >({
    reducer: (left, right) => [...left, ...right],
    default: () => [],
  }),
  toolIterations: Annotation<number>({
    reducer: (_left, right) => right,
    default: () => 0,
  }),
});
