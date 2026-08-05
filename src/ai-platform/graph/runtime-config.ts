import type { LangGraphRunnableConfig } from '@langchain/langgraph';

import type { ConversationMemoryPort } from '../domain/ports/conversation-memory.port';
import type { EmbeddingPort } from '../domain/ports/embedding.port';
import type { LlmPort } from '../domain/ports/llm.port';
import type { VectorSearchPort } from '../domain/ports/vector-search.port';
import type { RetrievedChunkState } from './state/tutor-agent.state';

export interface GraphRuntimeConfigurable {
  llmPort: LlmPort;
  embeddingPort?: EmbeddingPort;
  vectorSearchPort?: VectorSearchPort;
  conversationMemoryPort?: ConversationMemoryPort;
  onToken?: (token: string) => void | Promise<void>;
  onRetrieval?: (
    chunks: RetrievedChunkState[],
    usedFallback: boolean,
  ) => void | Promise<void>;
  maxTokens?: number;
  temperature?: number;
  allowedTools?: string[];
  runId?: string;
  agentId?: string;
  courseId?: string;
  lectureId?: string;
  threadId?: string;
}

export function getGraphRuntimeConfig(
  config: LangGraphRunnableConfig,
): GraphRuntimeConfigurable {
  const configurable = config.configurable as GraphRuntimeConfigurable | undefined;
  if (!configurable?.llmPort) {
    throw new Error('Graph runtime missing llmPort in configurable');
  }
  return configurable;
}
