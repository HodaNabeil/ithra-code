import type { AgentRunRequest, AgentRunResult } from './agent-definition';

export interface AgentRunContext {
  runId: string;
  agentId: string;
  request: AgentRunRequest;
}

export interface AgentError {
  code: string;
  message: string;
  retryable: boolean;
  runId: string;
}

export interface AgentLifecycleHooks {
  onStart?(context: AgentRunContext): Promise<void>;
  onComplete?(result: AgentRunResult): Promise<void>;
  onError?(error: AgentError): Promise<void>;
}
