import type {
  AgentDefinition,
  AgentRunRequest,
} from '../../agents/base/agent-definition';
import type { TutorAgentState } from '../../graph/state/tutor-agent.state';

export interface BuiltContext {
  initialState: TutorAgentState;
  promptVersion: string;
}

export interface RuntimeExecutionContext {
  runId: string;
  agentId: string;
  agent: AgentDefinition;
  request: AgentRunRequest;
  startedAt: number;
}
