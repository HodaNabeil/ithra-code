import type { EmbeddingPort, LlmPort, VectorSearchPort } from '../../domain/ports';
import type { MemoryStorePort } from '../../domain/ports/memory-store.port';
import { registerAgent } from '../../agents/definitions/agent-registry';
import {
  codeReviewerAgentDefinition,
  evaluatorAgentDefinition,
  supervisorAgentDefinition,
} from '../../agents/evaluator/evaluator-agent.definition';
import { tutorAgentDefinition } from '../../agents/tutor/tutor-agent.definition';
import { prismaMemoryFactRepository } from '../../memory/long-term/memory-fact.repository';
import { AnthropicLlmAdapter } from '../../providers/anthropic/anthropic-llm.adapter';
import { GeminiLlmAdapter } from '../../providers/gemini/gemini-llm.adapter';
import { OpenAIEmbeddingAdapter } from '../../providers/openai/openai-embedding.adapter';
import { OpenAILlmAdapter } from '../../providers/openai/openai-llm.adapter';
import {
  registerLlmProvider,
  resetProviderRegistryForTests,
} from '../../providers/registry/provider-registry';
import { ResilientLlmAdapter } from '../../providers/resilient/resilient-llm.adapter';
import { FallbackLlmAdapter } from '../../router/fallback-chain';
import { getFallbackChainForTask, resolveModelForPolicy } from '../../router/model-router';
import { postgresVectorSearchAdapter } from '../../rag/retrieval/postgres-vector-search.adapter';
import { registerStructuredOutputSchemas } from '../../structured-output/bootstrap';
import { resetSchemaRegistryForTests } from '../../structured-output/registry/schema-registry';
import { registerBuiltinTools } from '../../tools/builtin';
import { resetToolExecutorForTests } from '../../tools/executor/tool-executor';
import { McpClient, parseMcpServerConfigs } from '../../tools/mcp/mcp-client';
import { registerTool, resetToolRegistryForTests } from '../../tools/registry/tool-registry';
import { PlatformError, PlatformErrorCodes } from '../../shared/errors';
import { AIPlatformConfig, validateAIPlatformConfig } from '../config/ai-platform.config';
import { env } from '@/config/env';

type PlatformGlobalState = {
  llmPort?: LlmPort;
  embeddingPort?: EmbeddingPort;
  vectorSearchPort?: VectorSearchPort;
  memoryStore?: MemoryStorePort;
  mcpClient?: McpClient;
};

const globalForPlatform = globalThis as typeof globalThis & {
  __aiPlatformState?: PlatformGlobalState;
};

function getState(): PlatformGlobalState {
  if (!globalForPlatform.__aiPlatformState) {
    globalForPlatform.__aiPlatformState = {};
  }
  return globalForPlatform.__aiPlatformState;
}

let platformBootstrapped = false;

function bootstrapPlatform(): void {
  if (platformBootstrapped) {
    return;
  }

  registerAgent(tutorAgentDefinition);
  registerAgent(evaluatorAgentDefinition);
  registerAgent(codeReviewerAgentDefinition);
  registerAgent(supervisorAgentDefinition);

  registerBuiltinTools();
  registerStructuredOutputSchemas();

  const llmConfig = AIPlatformConfig.getLlmConfig();
  const openAiKey = AIPlatformConfig.getLlmApiKey();

  registerLlmProvider(
    'openai',
    new OpenAILlmAdapter(openAiKey, {
      baseURL: llmConfig.baseURL,
      model: llmConfig.model,
    }),
    ['gpt-3.5-turbo', 'gpt-4o-mini', 'gpt-4o'],
  );

  if (env.ANTHROPIC_API_KEY) {
    registerLlmProvider(
      'anthropic',
      new AnthropicLlmAdapter(env.ANTHROPIC_API_KEY),
      ['claude-3-5-haiku-20241022', 'claude-3-5-sonnet-20241022'],
    );
  }

  if (env.GOOGLE_AI_API_KEY) {
    registerLlmProvider(
      'gemini',
      new GeminiLlmAdapter(env.GOOGLE_AI_API_KEY),
      ['gemini-2.0-flash', 'gemini-1.5-flash'],
    );
  }

  const mcpConfigs = parseMcpServerConfigs(env.AI_PLATFORM_MCP_SERVERS);
  if (mcpConfigs.length > 0) {
    const mcpClient = new McpClient(mcpConfigs);
    void mcpClient.connect().then(() => {
      for (const tool of mcpClient.getTools()) {
        registerTool(tool, mcpClient.createHandler(tool.id));
      }
    });
    getState().mcpClient = mcpClient;
  }

  platformBootstrapped = true;
}

export function assertPlatformEnabled(): void {
  if (!AIPlatformConfig.isEnabled()) {
    throw new PlatformError(PlatformErrorCodes.AI_DISABLED, 'AI Platform is disabled');
  }

  validateAIPlatformConfig();
  bootstrapPlatform();
}

export function getLlmPort(): LlmPort {
  assertPlatformEnabled();
  const state = getState();

  if (!state.llmPort) {
    const llmConfig = AIPlatformConfig.getLlmConfig();
    const resolved = resolveModelForPolicy({
      task: 'education',
      preferredModel: llmConfig.model,
      maxTokens: llmConfig.maxTokens,
      temperature: llmConfig.temperature,
    });

    const inner = new FallbackLlmAdapter({
      primaryModel: resolved.model,
      fallbacks: getFallbackChainForTask('education', resolved.model),
    });

    state.llmPort = new ResilientLlmAdapter(inner);
  }

  return state.llmPort;
}

export function getEmbeddingPort(): EmbeddingPort {
  assertPlatformEnabled();
  const state = getState();

  if (!state.embeddingPort) {
    const embeddingConfig = AIPlatformConfig.getEmbeddingConfig();
    state.embeddingPort = new OpenAIEmbeddingAdapter(AIPlatformConfig.getLlmApiKey(), {
      baseURL: embeddingConfig.baseURL,
      model: embeddingConfig.model,
    });
  }

  return state.embeddingPort;
}

export function getVectorSearchPort(): VectorSearchPort {
  assertPlatformEnabled();
  const state = getState();

  if (!state.vectorSearchPort) {
    state.vectorSearchPort = postgresVectorSearchAdapter;
  }

  return state.vectorSearchPort;
}

export function getMemoryStorePort(): MemoryStorePort {
  assertPlatformEnabled();
  const state = getState();

  if (!state.memoryStore) {
    state.memoryStore = prismaMemoryFactRepository;
  }

  return state.memoryStore;
}

export function resetPlatformContainerForTests(): void {
  globalForPlatform.__aiPlatformState = {};
  platformBootstrapped = false;
  resetToolRegistryForTests();
  resetToolExecutorForTests();
  resetSchemaRegistryForTests();
  resetProviderRegistryForTests();
}
