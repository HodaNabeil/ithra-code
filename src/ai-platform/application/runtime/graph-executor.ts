import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import type { BaseCallbackHandler } from '@langchain/core/callbacks/base';

import type { ConversationMemoryPort } from '../../domain/ports/conversation-memory.port';
import type { EmbeddingPort } from '../../domain/ports/embedding.port';
import type { LlmPort } from '../../domain/ports/llm.port';
import type { VectorSearchPort } from '../../domain/ports/vector-search.port';
import { compileAgentGraph } from '../../graph/compiler/graph-compiler';
import type { AgentGraphState } from '../../graph/compiler/graph-compiler';
import type { GraphRuntimeConfigurable } from '../../graph/runtime-config';
import type { RetrievedChunkState } from '../../graph/state/tutor-agent.state';
import { withSpan } from '../../observability/opentelemetry/span-helpers';

export interface GraphExecutionInput {
  agentId: string;
  runId: string;
  state: AgentGraphState;
  llmPort: LlmPort;
  embeddingPort?: EmbeddingPort;
  vectorSearchPort?: VectorSearchPort;
  conversationMemoryPort?: ConversationMemoryPort;
  allowedTools?: string[];
  courseId?: string;
  lectureId?: string;
  threadId?: string;
  onToken?: (token: string) => void | Promise<void>;
  onRetrieval?: (
    chunks: RetrievedChunkState[],
    usedFallback: boolean,
  ) => void | Promise<void>;
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
    embeddingPort: input.embeddingPort,
    vectorSearchPort: input.vectorSearchPort,
    conversationMemoryPort: input.conversationMemoryPort,
    onToken: input.onToken,
    onRetrieval: input.onRetrieval,
    maxTokens: input.maxTokens,
    temperature: input.temperature,
    allowedTools: input.allowedTools,
    runId: input.runId,
    agentId: input.agentId,
    courseId: input.courseId,
    lectureId: input.lectureId,
    threadId: input.threadId,
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
