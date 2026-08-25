import type { ZodType } from 'zod';

import type { ToolDefinition, ToolHandler } from '../types';

type RegisteredTool = {
  definition: ToolDefinition;
  handler: ToolHandler;
};

const tools = new Map<string, RegisteredTool>();

export function registerTool(
  definition: ToolDefinition,
  handler: ToolHandler,
): void {
  tools.set(definition.id, { definition, handler });
}

export function getTool(toolId: string): RegisteredTool | undefined {
  return tools.get(toolId);
}

export function listTools(agentAllowedTools?: string[]): ToolDefinition[] {
  const all = [...tools.values()].map((entry) => entry.definition);
  if (!agentAllowedTools || agentAllowedTools.length === 0) {
    return [];
  }
  return all.filter((tool) => agentAllowedTools.includes(tool.id));
}

export function validateToolInput(
  toolId: string,
  input: unknown,
): {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
} {
  const entry = tools.get(toolId);
  if (!entry) {
    return { success: false, error: `Tool not found: ${toolId}` };
  }

  const parsed = entry.definition.inputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  return { success: true, data: parsed.data as Record<string, unknown> };
}

export function resetToolRegistryForTests(): void {
  tools.clear();
}

export function getToolOutputSchema(toolId: string): ZodType | undefined {
  return tools.get(toolId)?.definition.outputSchema;
}
