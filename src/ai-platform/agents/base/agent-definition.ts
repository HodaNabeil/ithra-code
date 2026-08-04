/**
 * Declarative agent configuration — agents are data, not classes.
 */

export type AgentCapability =
  | 'STREAMING'
  | 'RAG'
  | 'TOOLS'
  | 'STRUCTURED_OUTPUT';

export type MemoryScopeType = 'SESSION' | 'CONVERSATION' | 'LONG_TERM';

export type RetrievalMode = 'eager' | 'deferred';

export interface RoutingPolicy {
  task: string;
  preferredModel: string;
  maxTokens: number;
  temperature: number;
}

export interface GuardConfig {
  rateLimitPerMinute?: number;
  rateLimitPerHour?: number;
  dailyCostCap?: number;
  maxConcurrentStreams?: number;
}

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  graphId: string;
  capabilities: AgentCapability[];
  defaultModelPolicy: RoutingPolicy;
  allowedTools: string[];
  memoryScope: MemoryScopeType;
  promptNamespace: string;
  retrievalMode?: RetrievalMode;
  guards: GuardConfig;
}

export interface AgentScope {
  userId: string;
  courseId?: string;
  lectureId?: string;
  threadId?: string;
  conversationId?: string;
  [key: string]: string | undefined;
}

export interface AgentRunOptions {
  promptVersion?: string;
  promptLabel?: string;
  modelOverride?: string;
  maxTokens?: number;
  signal?: AbortSignal;
  correlationId?: string;
  metadata?: Record<string, unknown>;
  locale?: string;
}

export interface AgentRunRequest {
  userId: string;
  input: string;
  locale?: 'ar' | 'en';
  scope: AgentScope;
  options?: AgentRunOptions;
}

export interface TokenUsage {
  input: number;
  output: number;
  embedding?: number;
}

export interface AgentRunResult {
  runId: string;
  output: string;
  structuredOutput?: unknown;
  tokensUsed: TokenUsage;
  estimatedCost: number;
  promptVersion: string;
  model: string;
  durationMs: number;
}
