import type { LlmPort } from '../../domain/ports/llm.port';

export interface ModelInfo {
  id: string;
  provider: string;
  type: 'llm' | 'embedding';
  maxTokens: number;
  supportsStreaming: boolean;
}

type RegisteredLlm = {
  provider: string;
  adapter: LlmPort;
  models: string[];
};

const llmProviders: RegisteredLlm[] = [];
const modelIndex = new Map<string, RegisteredLlm>();

export function registerLlmProvider(
  provider: string,
  adapter: LlmPort,
  models: string[],
): void {
  const entry: RegisteredLlm = { provider, adapter, models };
  llmProviders.push(entry);
  for (const model of models) {
    modelIndex.set(model, entry);
  }
}

export function getLlmForModel(model: string): LlmPort {
  const entry = modelIndex.get(model);
  if (!entry) {
    const fallback = llmProviders[0];
    if (!fallback) {
      throw new Error('No LLM providers registered');
    }
    return fallback.adapter;
  }
  return entry.adapter;
}

export function getProviderForModel(model: string): string {
  return (
    modelIndex.get(model)?.provider ?? llmProviders[0]?.provider ?? 'openai'
  );
}

export function listModels(): ModelInfo[] {
  const models: ModelInfo[] = [];
  for (const entry of llmProviders) {
    for (const model of entry.models) {
      models.push({
        id: model,
        provider: entry.provider,
        type: 'llm',
        maxTokens: 128_000,
        supportsStreaming: true,
      });
    }
  }
  return models;
}

export function resetProviderRegistryForTests(): void {
  llmProviders.length = 0;
  modelIndex.clear();
}
