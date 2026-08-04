import type {
  CreatePromptVersion,
  PromptQuery,
  PromptRepositoryPort,
  PromptVersion,
  ResolvedPrompt,
} from '../ports/prompt-repository.port';
import { getLocalTemplate } from './template-registry';

export class FilePromptAdapter implements PromptRepositoryPort {
  async getPrompt(query: PromptQuery): Promise<ResolvedPrompt> {
    const locale = query.locale ?? 'ar';
    const local = getLocalTemplate(query.key, locale, query.variables);

    if (!local) {
      throw new Error(`Local prompt template not found: ${query.key} (${locale})`);
    }

    return {
      key: query.key,
      version: local.version,
      content: local.content,
      locale,
      variables: query.variables ?? {},
      resolvedAt: new Date(),
      source: 'local',
    };
  }

  async listVersions(promptKey: string): Promise<PromptVersion[]> {
    return [{ key: promptKey, version: 'local-v1', label: 'local' }];
  }

  async createVersion(prompt: CreatePromptVersion): Promise<PromptVersion> {
    return {
      key: prompt.key,
      version: 'local-v1',
      label: prompt.label,
      createdAt: new Date(),
    };
  }
}
