export type PromptLocale = 'ar' | 'en';

export type PromptLabel = 'development' | 'staging' | 'production';

export type PromptQuery = {
  key: string;
  version?: string;
  label?: PromptLabel;
  locale?: PromptLocale;
  variables?: Record<string, string>;
};

export type ResolvedPrompt = {
  key: string;
  version: string;
  content: string;
  locale: PromptLocale;
  variables: Record<string, string>;
  resolvedAt: Date;
  source: 'langfuse' | 'local' | 'cache';
};

export type PromptVersion = {
  key: string;
  version: string;
  label?: string;
  createdAt?: Date;
};

export type CreatePromptVersion = {
  key: string;
  content: string;
  locale?: PromptLocale;
  label?: PromptLabel;
};

export interface PromptRepositoryPort {
  getPrompt(query: PromptQuery): Promise<ResolvedPrompt>;
  listVersions(promptKey: string): Promise<PromptVersion[]>;
  createVersion?(prompt: CreatePromptVersion): Promise<PromptVersion>;
}
