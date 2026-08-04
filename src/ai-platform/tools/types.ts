import type { ZodType } from 'zod';

import type { MemoryScope } from '../domain/ports/memory-store.port';

export type ToolSource = 'builtin' | 'mcp';

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  source: ToolSource;
  inputSchema: ZodType;
  outputSchema: ZodType;
  timeout: number;
  requiresAuth: boolean;
  metadata?: Record<string, unknown>;
}

export interface ToolContext {
  userId: string;
  agentRunId: string;
  scope: MemoryScope;
  signal: AbortSignal;
  courseId?: string;
}

export type ToolHandler = (
  input: Record<string, unknown>,
  context: ToolContext,
) => Promise<Record<string, unknown>>;

export interface ToolResultError {
  code: 'TIMEOUT' | 'VALIDATION_ERROR' | 'EXECUTION_ERROR' | 'NOT_ALLOWED';
  message: string;
  retryable: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: Record<string, unknown>;
  error?: ToolResultError;
  durationMs: number;
}

export interface ToolInvocationRecord {
  toolId: string;
  agentRunId: string;
  userId: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  durationMs: number;
  status: 'success' | 'failed' | 'timeout';
}
