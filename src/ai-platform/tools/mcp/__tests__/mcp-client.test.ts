import assert from 'node:assert/strict';
import { describe, it, afterEach } from 'node:test';

import { McpClient } from '../mcp-client';

const originalFetch = globalThis.fetch;

function mockFetch(
  handler: (url: string, init?: RequestInit) => { status: number; body: unknown } | null,
) {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const result = handler(url, init);
    if (!result) {
      return new Response('not found', { status: 404 });
    }
    return new Response(JSON.stringify(result.body), { status: result.status });
  }) as typeof fetch;
}

describe('McpClient', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('discovers tools and converts JSON Schema parameters into real Zod schemas', async () => {
    mockFetch((url) => {
      if (url === 'http://mcp.local/tools') {
        return {
          status: 200,
          body: {
            tools: [
              {
                name: 'lookup',
                description: 'Looks something up',
                inputSchema: {
                  type: 'object',
                  properties: {
                    term: { type: 'string' },
                    limit: { type: 'integer' },
                  },
                  required: ['term'],
                },
              },
            ],
          },
        };
      }
      return null;
    });

    const client = new McpClient([
      { id: 'srv1', transport: 'http', url: 'http://mcp.local' },
    ]);
    await client.connect();

    const tools = client.getTools();
    assert.equal(tools.length, 1);
    assert.equal(tools[0]!.id, 'mcp:srv1:lookup');

    const validParse = tools[0]!.inputSchema.safeParse({ term: 'react' });
    assert.equal(validParse.success, true);

    const invalidParse = tools[0]!.inputSchema.safeParse({ limit: 5 });
    assert.equal(invalidParse.success, false);
  });

  it('lists resources across configured HTTP servers', async () => {
    mockFetch((url) => {
      if (url === 'http://mcp.local/resources') {
        return {
          status: 200,
          body: {
            resources: [{ uri: 'file://a.txt', name: 'a', description: 'doc a' }],
          },
        };
      }
      return null;
    });

    const client = new McpClient([
      { id: 'srv1', transport: 'http', url: 'http://mcp.local' },
    ]);

    const resources = await client.listResources();
    assert.equal(resources.length, 1);
    assert.equal(resources[0]!.uri, 'file://a.txt');
    assert.equal(resources[0]!.serverId, 'srv1');
  });

  it('reads a resource by uri from the server that has it', async () => {
    mockFetch((url) => {
      if (url.startsWith('http://mcp.local/resources/read')) {
        return { status: 200, body: { contents: 'hello world' } };
      }
      return null;
    });

    const client = new McpClient([
      { id: 'srv1', transport: 'http', url: 'http://mcp.local' },
    ]);

    const content = await client.readResource('file://a.txt');
    assert.equal(content, 'hello world');
  });

  it('throws when no configured server has the requested resource', async () => {
    mockFetch(() => null);

    const client = new McpClient([
      { id: 'srv1', transport: 'http', url: 'http://mcp.local' },
    ]);

    await assert.rejects(() => client.readResource('file://missing.txt'));
  });
});
