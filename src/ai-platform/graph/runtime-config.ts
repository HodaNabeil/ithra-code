import type { LangGraphRunnableConfig } from '@langchain/langgraph';

import type { ConversationMemoryPort } from '../domain/ports/conversation-memory.port';
import type { EmbeddingPort } from '../domain/ports/embedding.port';
import type { LlmPort } from '../domain/ports/llm.port';
import type { ResponseEnricherPort } from '../domain/ports/response-enricher.port';
import type { ResponseProcessorPort } from '../domain/ports/response-processor.port';
import type { VectorSearchPort } from '../domain/ports/vector-search.port';
import type { RetrievedChunkState } from './state/tutor-agent.state';

/**
 * @deprecated Use ResponseProcessorPort. Kept for backward-compatible metadata injection.
 */
export interface EducationalContentValidatorPort {
  validateResponse(
    response: string,
    context: {
      question?: string;
      retrievedSources?: Array<{
        content: string;
        metadata: Record<string, unknown>;
      }>;
      courseId?: string;
      lectureId?: string;
    },
    options?: {
      strictMode?: boolean;
      courseId?: string;
      lectureId?: string;
    },
  ): Promise<{
    isValid: boolean;
    suggestedResponse?: string;
  }>;
}

export interface GraphRuntimeConfigurable {
  llmPort: LlmPort;
  embeddingPort?: EmbeddingPort;
  vectorSearchPort?: VectorSearchPort;
  conversationMemoryPort?: ConversationMemoryPort;
  responseProcessor?: ResponseProcessorPort;
  responseEnricher?: ResponseEnricherPort;
  enrichmentContext?: Record<string, unknown>;
  /** @deprecated Use responseProcessor */
  contentValidator?: EducationalContentValidatorPort;
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
  model?: string;
}

export function getGraphRuntimeConfig(
  config: LangGraphRunnableConfig,
): GraphRuntimeConfigurable {
  const configurable = config.configurable as
    | GraphRuntimeConfigurable
    | undefined;
  if (!configurable?.llmPort) {
    throw new Error('Graph runtime missing llmPort in configurable');
  }
  return configurable;
}
