import { AIPlatformConfig } from '../infrastructure/config/ai-platform.config';

import { getCachedPrompt, setCachedPrompt } from './cache/prompt-cache';
import { LangfusePromptAdapter } from './langfuse/langfuse-prompt.adapter';
import { getLocalTemplate } from './local/template-registry';
import type {
  PromptLabel,
  PromptLocale,
  PromptQuery,
  ResolvedPrompt,
} from './ports/prompt-repository.port';

let adapter: LangfusePromptAdapter | null = null;

function getAdapter(): LangfusePromptAdapter {
  if (!adapter) {
    adapter = new LangfusePromptAdapter();
  }
  return adapter;
}

export function resolvePromptSync(
  key: string,
  locale: PromptLocale = 'ar',
  variables?: Record<string, string>,
): ResolvedPrompt {
  const local = getLocalTemplate(key, locale, variables);
  if (!local) {
    return {
      key,
      version: 'inline-fallback',
      content: '',
      locale,
      variables: variables ?? {},
      resolvedAt: new Date(),
      source: 'local',
    };
  }

  return {
    key,
    version: local.version,
    content: local.content,
    locale,
    variables: variables ?? {},
    resolvedAt: new Date(),
    source: 'local',
  };
}

export async function resolvePrompt(
  key: string,
  options?: {
    locale?: PromptLocale;
    label?: PromptLabel;
    version?: string;
    variables?: Record<string, string>;
  },
): Promise<ResolvedPrompt> {
  const query: PromptQuery = {
    key,
    locale: options?.locale ?? 'ar',
    label: options?.label ?? AIPlatformConfig.getLangfusePromptLabel(),
    version: options?.version,
    variables: options?.variables,
  };

  const cached = getCachedPrompt(query);
  if (cached) {
    return cached;
  }

  const resolved = await getAdapter().getPrompt(query);
  setCachedPrompt(query, resolved, AIPlatformConfig.getPromptCacheTtlMs());
  return resolved;
}

export function resetPromptResolverForTests(): void {
  adapter = null;
}
