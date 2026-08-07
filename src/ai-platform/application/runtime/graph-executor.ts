import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import type { BaseCallbackHandler } from '@langchain/core/callbacks/base';

import type { ConversationMemoryPort } from '../../domain/ports/conversation-memory.port';
import type { EmbeddingPort } from '../../domain/ports/embedding.port';
import type { LlmPort } from '../../domain/ports/llm.port';
import type { ResponseEnricherPort } from '../../domain/ports/response-enricher.port';
import type { ResponseProcessorPort } from '../../domain/ports/response-processor.port';
import type { VectorSearchPort } from '../../domain/ports/vector-search.port';
import { compileAgentGraph } from '../../graph/compiler/graph-compiler';
import type { AgentGraphState } from '../../graph/compiler/graph-compiler';
import type {
  EducationalContentValidatorPort,
  GraphRuntimeConfigurable,
} from '../../graph/runtime-config';
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
  onStateUpdate?: (state: AgentGraphState) => void;
  maxTokens?: number;
  temperature?: number;
  model?: string;
  signal?: AbortSignal;
  callbacks?: BaseCallbackHandler[];
  traceMetadata?: Record<string, unknown>;
  responseProcessor?: ResponseProcessorPort;
  responseEnricher?: ResponseEnricherPort;
  enrichmentContext?: Record<string, unknown>;
  /** @deprecated Use responseProcessor */
  contentValidator?: EducationalContentValidatorPort;
}

export interface GraphExecutionResult {
  finalState: AgentGraphState;
}

function buildConfigurable(input: GraphExecutionInput): GraphRuntimeConfigurable {
  return {
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
    responseProcessor: input.responseProcessor,
    responseEnricher: input.responseEnricher,
    enrichmentContext: input.enrichmentContext,
    contentValidator: input.contentValidator,
    model: input.model,
  };
}

function buildRunnableConfig(input: GraphExecutionInput): LangGraphRunnableConfig {
  return {
    configurable: buildConfigurable(input),
    signal: input.signal,
    recursionLimit: 25,
    callbacks: input.callbacks,
    metadata: input.traceMetadata,
    runName: `agent:${input.agentId}`,
    tags: [input.agentId],
  };
}

export async function invokeAgentGraph(
  input: GraphExecutionInput,
): Promise<GraphExecutionResult> {
  const graph = compileAgentGraph(input.agentId);
  const config = buildRunnableConfig(input);

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

/**
 * Streaming execution path — uses graph.stream() so the runtime can observe
 * state snapshots (e.g. executionPolicy) while nodes are still running.
 */
export async function streamAgentGraph(
  input: GraphExecutionInput,
): Promise<GraphExecutionResult> {
  const graph = compileAgentGraph(input.agentId);
  const config = buildRunnableConfig(input);
  let latestState = input.state;

  await withSpan(
    'ai.graph.stream',
    {
      'ai.agent.id': input.agentId,
      'ai.run.id': input.runId,
    },
    async () => {
      const stream = await graph.stream(
        input.state as unknown as Parameters<typeof graph.stream>[0],
        {
          ...config,
          streamMode: 'values',
        },
      );

      for await (const chunk of stream) {
        latestState = chunk as unknown as AgentGraphState;
        input.onStateUpdate?.(latestState);
      }
    },
  );

  return { finalState: latestState };
}
