/**
 * LlmPort — abstraction for large language model streaming generation.
 */

export interface LlmMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LlmTokenUsage {
  input: number;
  output: number;
}

export interface LlmStreamOptions {
  messages: LlmMessage[];
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
  tools?: LlmToolDefinition[];
  signal?: AbortSignal;
  onUsage?: (usage: LlmTokenUsage) => void;
}

export interface LlmCompleteOptions {
  messages: LlmMessage[];
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
  responseFormat?: 'text' | 'json';
  jsonSchema?: Record<string, unknown>;
  tools?: LlmToolDefinition[];
  signal?: AbortSignal;
}

export interface LlmToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface LlmCompleteResult {
  content: string;
  usage?: LlmTokenUsage;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  }>;
}

export interface LlmPort {
  streamAnswer(options: LlmStreamOptions): AsyncIterableIterator<string>;
  complete?(options: LlmCompleteOptions): Promise<LlmCompleteResult>;
}

export class LlmError extends Error {
  constructor(
    public code: string,
    message: string,
    public retryable: boolean = false,
  ) {
    super(message);
    this.name = 'LlmError';
  }
}

export const LlmErrorCodes = {
  RATE_LIMITED: 'RATE_LIMITED',
  TIMEOUT: 'TIMEOUT',
  INVALID_REQUEST: 'INVALID_REQUEST',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  UNKNOWN: 'UNKNOWN',
} as const;
