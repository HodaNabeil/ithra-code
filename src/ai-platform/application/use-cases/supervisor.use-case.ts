import { randomUUID } from 'node:crypto';

import type {
  AgentRunRequest,
  AgentRunResult,
} from '../../agents/base/agent-definition';
import { getAgentDefinition } from '../../agents/definitions/agent-registry';
import { runAgent } from '../use-cases/run-agent.use-case';
import { detectSupervisorRoute } from '../../agents/evaluator/evaluator-agent.definition';

export interface SupervisorRouteResult {
  targetAgentId: string;
  result: AgentRunResult;
}

/**
 * Routes user input to tutor, evaluator, or code-reviewer via intent detection.
 */
export async function routeSupervisorRequest(
  request: AgentRunRequest,
): Promise<SupervisorRouteResult> {
  const route = detectSupervisorRoute(request.input);
  const targetAgentId = route;

  getAgentDefinition(targetAgentId);

  const result = await runAgent(targetAgentId, {
    ...request,
    options: {
      ...request.options,
      correlationId: request.options?.correlationId ?? randomUUID(),
      metadata: {
        ...request.options?.metadata,
        supervisorRoute: route,
      },
    },
  });

  return { targetAgentId, result };
}
