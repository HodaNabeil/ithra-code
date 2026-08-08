import type { ZodType } from 'zod';

export interface OutputSchema {
  id: string;
  version: number;
  description: string;
  agentIds: string[];
  jsonSchema: Record<string, unknown>;
  zodSchema: ZodType;
  isActive: boolean;
}

const schemas = new Map<string, OutputSchema>();

function schemaKey(id: string, version: number): string {
  return `${id}:v${version}`;
}

export function registerOutputSchema(schema: OutputSchema): void {
  schemas.set(schemaKey(schema.id, schema.version), schema);
}

export function getOutputSchema(id: string, version?: number): OutputSchema | undefined {
  if (version !== undefined) {
    return schemas.get(schemaKey(id, version));
  }

  const matches = [...schemas.values()].filter((schema) => schema.id === id);
  return matches.sort((a, b) => b.version - a.version)[0];
}

export function getSchemasForAgent(agentId: string): OutputSchema[] {
  return [...schemas.values()].filter(
    (schema) => schema.isActive && schema.agentIds.includes(agentId),
  );
}

export function resetSchemaRegistryForTests(): void {
  schemas.clear();
}
