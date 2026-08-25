import Langfuse from 'langfuse';

import { AIPlatformConfig } from '../../infrastructure/config/ai-platform.config';
import { logger } from '@/lib/logger';

import type {
  PromptQuery,
  PromptRepositoryPort,
  PromptVersion,
  ResolvedPrompt,
} from '../ports/prompt-repository.port';
import { FilePromptAdapter } from '../local/file-prompt.adapter';

export class LangfusePromptAdapter implements PromptRepositoryPort {
  private readonly client: Langfuse | null;
  private readonly fallback: FilePromptAdapter;

  constructor() {
    const config = AIPlatformConfig.getLangfuseConfig();
    this.client = config.enabled
      ? new Langfuse({
          publicKey: config.publicKey!,
          secretKey: config.secretKey!,
          baseUrl: config.host,
        })
      : null;
    this.fallback = new FilePromptAdapter();
  }

  async getPrompt(query: PromptQuery): Promise<ResolvedPrompt> {
    if (!this.client) {
      return this.fallback.getPrompt(query);
    }

    const locale = query.locale ?? 'ar';
    const label = query.label ?? AIPlatformConfig.getLangfusePromptLabel();

    try {
      const promptClient = await this.client.getPrompt(query.key, undefined, {
        label,
        cacheTtlSeconds: Math.floor(
          AIPlatformConfig.getPromptCacheTtlMs() / 1000,
        ),
      });

      const compiled = promptClient.compile(query.variables ?? {});
      const content =
        typeof compiled === 'string' ? compiled : String(compiled);

      return {
        key: query.key,
        version: String(promptClient.version ?? 'unknown'),
        content,
        locale,
        variables: query.variables ?? {},
        resolvedAt: new Date(),
        source: 'langfuse',
      };
    } catch (error) {
      logger.warn(
        { error, key: query.key, label },
        '[LANGFUSE_PROMPT_FALLBACK] Using local template',
      );
      return this.fallback.getPrompt(query);
    }
  }

  async listVersions(promptKey: string): Promise<PromptVersion[]> {
    return this.fallback.listVersions(promptKey);
  }
}
