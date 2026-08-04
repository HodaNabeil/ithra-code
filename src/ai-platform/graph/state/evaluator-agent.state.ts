import { Annotation } from '@langchain/langgraph';

import type { LlmMessage } from '../../domain/ports/llm.port';
import type { EvaluatorRubricV1 } from '../../structured-output/schemas/evaluator-rubric.v1';

export interface EvaluatorAgentState {
  agentId: string;
  userId: string;
  input: string;
  locale: 'ar' | 'en';
  systemPrompt: string;
  rubricCriteria: Array<{ id: string; name: string; maxScore: number }>;
  sanitizedInput: string;
  structuredOutput?: EvaluatorRubricV1;
  structuredOutputStatus: 'valid' | 'repaired' | 'rejected' | 'pending';
  finalResponse: string;
  validationErrors: string[];
  tokensUsed: { input: number; output: number };
}

export const EvaluatorAgentStateAnnotation = Annotation.Root({
  agentId: Annotation<string>,
  userId: Annotation<string>,
  input: Annotation<string>,
  locale: Annotation<'ar' | 'en'>,
  systemPrompt: Annotation<string>,
  rubricCriteria: Annotation<Array<{ id: string; name: string; maxScore: number }>>({
    reducer: (_left, right) => right,
    default: () => [],
  }),
  sanitizedInput: Annotation<string>,
  structuredOutput: Annotation<EvaluatorRubricV1 | undefined>,
  structuredOutputStatus: Annotation<'valid' | 'repaired' | 'rejected' | 'pending'>,
  finalResponse: Annotation<string>,
  validationErrors: Annotation<string[]>({
    reducer: (_left, right) => right,
    default: () => [],
  }),
  tokensUsed: Annotation<{ input: number; output: number }>({
    reducer: (_left, right) => right,
    default: () => ({ input: 0, output: 0 }),
  }),
  conversationHistory: Annotation<LlmMessage[]>({
    reducer: (_left, right) => right,
    default: () => [],
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
