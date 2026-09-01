import type { RoutingPolicy } from '../agents/base/agent-definition';
import { AIPlatformConfig } from '../infrastructure/config/ai-platform.config';

export interface ResolvedModel {
  model: string;
  provider: string;
  maxTokens: number;
  temperature: number;
}

const TASK_FALLBACKS: Record<string, string[]> = {
  education: ['gpt-4o-mini', 'claude-3-5-haiku-20241022', 'gemini-2.0-flash'],
  evaluation: ['gpt-4o-mini', 'claude-3-5-haiku-20241022'],
  summarization: ['gpt-4o-mini', 'gemini-2.0-flash'],
  code_review: ['gpt-4o', 'claude-3-5-sonnet-20241022'],
};

export function resolveModelForPolicy(
  policy: RoutingPolicy,
  override?: string,
): ResolvedModel {
  const llmConfig = AIPlatformConfig.getLlmConfig();
  const model = override ?? policy.preferredModel ?? llmConfig.model;

  return {
    model,
    provider: inferProvider(model),
    maxTokens: policy.maxTokens,
    temperature: policy.temperature,
  };
}

export function getFallbackChainForTask(
  task: string,
  primaryModel: string,
): string[] {
  const defaults = TASK_FALLBACKS[task] ?? TASK_FALLBACKS.education ?? [];
  return defaults.filter((model) => model !== primaryModel);
}

function inferProvider(model: string): string {
  if (model.startsWith('claude')) {
    return 'anthropic';
  }
  if (model.startsWith('gemini')) {
    return 'gemini';
  }
  return 'openai';
}
