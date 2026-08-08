import { z } from 'zod';
import type { ZodType } from 'zod';

/**
 * Minimal JSON Schema (subset) -> Zod converter for tool parameter schemas
 * discovered from MCP servers. Supports the shapes MCP tool definitions
 * commonly use (object/string/number/integer/boolean/array/enum, required,
 * nested objects) without pulling in a new dependency. Falls back to
 * `z.unknown()` for anything unrecognized so validation degrades gracefully
 * instead of throwing during discovery.
 */
export interface JsonSchema {
  type?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  enum?: unknown[];
  description?: string;
  [key: string]: unknown;
}

function convertLeaf(schema: JsonSchema): ZodType {
  if (schema.enum && schema.enum.length > 0) {
    return z.enum(schema.enum.map(String) as [string, ...string[]]);
  }

  switch (schema.type) {
    case 'string':
      return z.string();
    case 'number':
      return z.number();
    case 'integer':
      return z.number().int();
    case 'boolean':
      return z.boolean();
    case 'array':
      return z.array(schema.items ? convertLeaf(schema.items) : z.unknown());
    case 'object':
      return jsonSchemaToZodObject(schema);
    default:
      return z.unknown();
  }
}

export function jsonSchemaToZodObject(schema: JsonSchema | undefined): ZodType {
  if (!schema || schema.type !== 'object' || !schema.properties) {
    return z.record(z.string(), z.unknown());
  }

  const required = new Set(schema.required ?? []);
  const shape: Record<string, ZodType> = {};

  for (const [key, propSchema] of Object.entries(schema.properties)) {
    const converted = convertLeaf(propSchema);
    shape[key] = required.has(key) ? converted : converted.optional();
  }

  return z.object(shape);
}
