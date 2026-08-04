import type { LangGraphRunnableConfig } from '@langchain/langgraph';

import type { LlmPort } from '../domain/ports/llm.port';

export interface GraphRuntimeConfigurable {
  llmPort: LlmPort;
  onToken?: (token: string) => void | Promise<void>;
  maxTokens?: number;
  temperature?: number;
  allowedTools?: string[];
  runId?: string;
  agentId?: string;
  courseId?: string;
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
