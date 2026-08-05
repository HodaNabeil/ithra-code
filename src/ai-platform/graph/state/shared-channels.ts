import { Annotation } from '@langchain/langgraph';

/**
 * Generic execution delivery policy — product-agnostic.
 * Graph nodes set this on state; the runtime observes it during streaming.
 */
export type ExecutionPolicy = 'LIVE' | 'BUFFERED';

export interface AgentExecutionState {
  executionPolicy: ExecutionPolicy;
  finalResponse: string;
  tokensUsed: { input: number; output: number };
  validationErrors: string[];
  runSignals: Record<string, unknown>;
}

export function readExecutionPolicy(state: unknown): ExecutionPolicy {
  if (
    typeof state === 'object' &&
    state !== null &&
    'executionPolicy' in state &&
    (state.executionPolicy === 'LIVE' || state.executionPolicy === 'BUFFERED')
  ) {
    return state.executionPolicy;
  }
  return 'LIVE';
}

export const executionPolicyChannel = Annotation<ExecutionPolicy>({
  reducer: (_left, right) => right,
  default: () => 'LIVE',
});

export const tokensUsedChannel = Annotation<{ input: number; output: number }>({
  reducer: (_left, right) => right,
  default: () => ({ input: 0, output: 0 }),
});

export const validationErrorsChannel = Annotation<string[]>({
  reducer: (_left, right) => right,
  default: () => [],
});

export const runSignalsChannel = Annotation<Record<string, unknown>>({
  reducer: (left, right) => ({ ...left, ...right }),
  default: () => ({}),
});

/** Shared execution channels spread into each agent Annotation.Root. */
export const agentExecutionChannels = {
  executionPolicy: executionPolicyChannel,
  tokensUsed: tokensUsedChannel,
  validationErrors: validationErrorsChannel,
  runSignals: runSignalsChannel,
} as const;
