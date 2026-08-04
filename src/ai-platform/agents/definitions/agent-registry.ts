import type { AgentDefinition } from '../base/agent-definition';
import { PlatformError, PlatformErrorCodes } from '../../shared/errors';

const registry = new Map<string, AgentDefinition>();

export function registerAgent(definition: AgentDefinition): void {
  registry.set(definition.id, definition);
}

export function getAgentDefinition(agentId: string): AgentDefinition {
  const definition = registry.get(agentId);
  if (!definition) {
    throw new PlatformError(
      PlatformErrorCodes.VALIDATION_ERROR,
      `Unknown agent: ${agentId}`,
      false,
      { agentId },
    );
  }
  return definition;
}

export function hasAgent(agentId: string): boolean {
  return registry.has(agentId);
}

export function listAgents(): AgentDefinition[] {
  return [...registry.values()];
}

export function resetAgentRegistryForTests(): void {
  registry.clear();
}
