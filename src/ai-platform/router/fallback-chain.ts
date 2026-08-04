import type { LlmPort, LlmCompleteOptions, LlmCompleteResult, LlmStreamOptions } from '../domain/ports/llm.port';
import { getLlmForModel } from '../providers/registry/provider-registry';

export interface FallbackChainConfig {
  primaryModel: string;
  fallbacks: string[];
}

export class FallbackLlmAdapter implements LlmPort {
  constructor(private readonly chain: FallbackChainConfig) {}

  async *streamAnswer(options: LlmStreamOptions): AsyncIterableIterator<string> {
    const models = [this.chain.primaryModel, ...this.chain.fallbacks];
    let lastError: unknown;

    for (const model of models) {
      try {
        const adapter = getLlmForModel(model);
        for await (const token of adapter.streamAnswer({ ...options, model })) {
          yield token;
        }
        return;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  }

  async complete(options: LlmCompleteOptions): Promise<LlmCompleteResult> {
    const models = [this.chain.primaryModel, ...this.chain.fallbacks];
    let lastError: unknown;

    for (const model of models) {
      try {
        const adapter = getLlmForModel(model);
        if (!adapter.complete) {
          continue;
        }
        return await adapter.complete({ ...options, model });
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  }
}
