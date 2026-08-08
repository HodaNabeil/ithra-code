import type {
  AgentRunRequest,
  AgentRunResult,
} from '../../agents/base/agent-definition';
import type { ChatStreamEvent } from '../../shared/types';
import { executeAgentRun, executeAgentStream } from '../runtime/agent-runtime';

export async function runAgent(
  agentId: string,
  request: AgentRunRequest,
): Promise<AgentRunResult> {
  return executeAgentRun(agentId, request);
}

export async function* streamAgent(
  agentId: string,
  request: AgentRunRequest,
): AsyncGenerator<ChatStreamEvent> {
  yield* executeAgentStream(agentId, request);
}
