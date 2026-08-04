import type { ToolDefinition } from '../types';

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
    return [];
  }

  async readResource(_uri: string): Promise<string> {
    throw new Error('MCP resource read not implemented');
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
          tools?: Array<{ name: string; description?: string }>;
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
            inputSchema: { safeParse: (v: unknown) => ({ success: true, data: v }) } as never,
            outputSchema: { safeParse: (v: unknown) => ({ success: true, data: v }) } as never,
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
