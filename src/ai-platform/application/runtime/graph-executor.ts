import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import type { BaseCallbackHandler } from '@langchain/core/callbacks/base';

import type { LlmPort } from '../../domain/ports/llm.port';
import { compileAgentGraph } from '../../graph/compiler/graph-compiler';
import type { AgentGraphState } from '../../graph/compiler/graph-compiler';
import type { GraphRuntimeConfigurable } from '../../graph/runtime-config';
import { withSpan } from '../../observability/opentelemetry/span-helpers';

export interface GraphExecutionInput {
  agentId: string;
  runId: string;
  state: AgentGraphState;
  llmPort: LlmPort;
  allowedTools?: string[];
  courseId?: string;
  onToken?: (token: string) => void | Promise<void>;
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
  callbacks?: BaseCallbackHandler[];
  traceMetadata?: Record<string, unknown>;
}

export interface GraphExecutionResult {
  finalState: AgentGraphState;
}

export async function invokeAgentGraph(
  input: GraphExecutionInput,
): Promise<GraphExecutionResult> {
  const graph = compileAgentGraph(input.agentId);
  const configurable: GraphRuntimeConfigurable = {
    llmPort: input.llmPort,
    onToken: input.onToken,
    maxTokens: input.maxTokens,
    temperature: input.temperature,
    allowedTools: input.allowedTools,
    runId: input.runId,
    agentId: input.agentId,
    courseId: input.courseId,
  };

  const config: LangGraphRunnableConfig = {
    configurable,
    signal: input.signal,
    recursionLimit: 25,
    callbacks: input.callbacks,
    metadata: input.traceMetadata,
    runName: `agent:${input.agentId}`,
    tags: [input.agentId],
  };

  const finalState = (await withSpan(
    'ai.graph.execute',
    {
      'ai.agent.id': input.agentId,
      'ai.run.id': input.runId,
    },
    async () =>
      graph.invoke(
        input.state as unknown as Parameters<typeof graph.invoke>[0],
        config,
      ) as unknown as Promise<AgentGraphState>,
  )) as AgentGraphState;

  return { finalState };
}
