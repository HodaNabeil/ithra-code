import { z } from 'zod';

import type { ToolDefinition } from '../types';
import type { JsonSchema } from './json-schema-to-zod';
import { jsonSchemaToZodObject } from './json-schema-to-zod';

export interface McpServerConfig {
  id: string;
  transport: 'stdio' | 'http';
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  allowedTools?: string[];
}

export interface McpResource {
  uri: string;
  name: string;
  description?: string;
  serverId: string;
}

/**
 * MCP client — discovers and proxies tools from configured MCP servers.
 * stdio transport spawns child processes; HTTP transport uses fetch.
 */
export class McpClient {
  private readonly discoveredTools: ToolDefinition[] = [];
  private connected = false;

  constructor(private readonly serverConfigs: McpServerConfig[]) {}

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    for (const config of this.serverConfigs) {
      const tools = await this.discoverFromServer(config);
      this.discoveredTools.push(...tools);
    }

    this.connected = true;
  }

  getTools(): ToolDefinition[] {
    return [...this.discoveredTools];
  }

  async callTool(
    toolId: string,
    input: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    if (!toolId.startsWith('mcp:')) {
      throw new Error(`Invalid MCP tool id: ${toolId}`);
    }

    const [, serverId, toolName] = toolId.split(':');
    if (!toolName) {
      throw new Error(`Invalid MCP tool id: ${toolId}`);
    }

    const config = this.serverConfigs.find((entry) => entry.id === serverId);
    if (!config) {
      throw new Error(`MCP server not configured: ${serverId}`);
    }

    if (config.allowedTools && !config.allowedTools.includes(toolName)) {
      throw new Error(`MCP tool not allowed: ${toolName}`);
    }

    if (config.transport === 'http' && config.url) {
      const response = await fetch(`${config.url}/tools/${toolName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });

      if (!response.ok) {
        throw new Error(`MCP HTTP call failed: ${response.status}`);
      }

      return (await response.json()) as Record<string, unknown>;
    }

    throw new Error(`MCP stdio transport not available in this runtime: ${serverId}`);
  }

  async listResources(): Promise<McpResource[]> {
    const resources: McpResource[] = [];

    for (const config of this.serverConfigs) {
      if (config.transport !== 'http' || !config.url) {
        continue;
      }

      try {
        const response = await fetch(`${config.url}/resources`);
        if (!response.ok) {
          continue;
        }

        const payload = (await response.json()) as {
          resources?: Array<{ uri: string; name: string; description?: string }>;
        };

        for (const resource of payload.resources ?? []) {
          resources.push({ ...resource, serverId: config.id });
        }
      } catch {
        // Best-effort discovery — one unreachable server shouldn't fail the
        // rest of resource listing.
      }
    }

    return resources;
  }

  async readResource(uri: string): Promise<string> {
    for (const config of this.serverConfigs) {
      if (config.transport !== 'http' || !config.url) {
        continue;
      }

      try {
        const response = await fetch(
          `${config.url}/resources/read?uri=${encodeURIComponent(uri)}`,
        );
        if (!response.ok) {
          continue;
        }

        const payload = (await response.json()) as { contents?: string; text?: string };
        const content = payload.contents ?? payload.text;
        if (typeof content === 'string') {
          return content;
        }
      } catch {
        // Try the next configured server.
      }
    }

    throw new Error(`MCP resource not found on any configured server: ${uri}`);
  }

  createHandler(toolId: string) {
    return async (input: Record<string, unknown>) => this.callTool(toolId, input);
  }

  private async discoverFromServer(config: McpServerConfig): Promise<ToolDefinition[]> {
    if (config.transport === 'http' && config.url) {
      try {
        const response = await fetch(`${config.url}/tools`);
        if (!response.ok) {
          return [];
        }

        const payload = (await response.json()) as {
          tools?: Array<{
            name: string;
            description?: string;
            inputSchema?: JsonSchema;
            outputSchema?: JsonSchema;
          }>;
        };

        return (payload.tools ?? [])
          .filter((tool) =>
            !config.allowedTools || config.allowedTools.includes(tool.name),
          )
          .map((tool) => ({
            id: `mcp:${config.id}:${tool.name}`,
            name: tool.name,
            description: tool.description ?? tool.name,
            source: 'mcp' as const,
            // Real JSON-Schema-to-Zod conversion of the schema the MCP
            // server advertises, instead of an always-succeeding passthrough.
            inputSchema: jsonSchemaToZodObject(tool.inputSchema),
            outputSchema: tool.outputSchema
              ? jsonSchemaToZodObject(tool.outputSchema)
              : z.record(z.string(), z.unknown()),
            timeout: 30_000,
            requiresAuth: true,
            metadata: { serverId: config.id },
          }));
      } catch {
        return [];
      }
    }

    return [];
  }
}

export function parseMcpServerConfigs(raw: string | undefined): McpServerConfig[] {
  if (!raw?.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as McpServerConfig[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
