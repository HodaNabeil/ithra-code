import { getTool, validateToolInput } from '../registry/tool-registry';
import type { ToolContext, ToolResult } from '../types';
import { withSpan } from '../../observability/opentelemetry/span-helpers';
import { platformMetrics } from '../../observability/metrics/platform-metrics';
import { logToolInvocation } from './tool-audit.service';

const MAX_CONCURRENT_PER_RUN = 3;
const runConcurrency = new Map<string, number>();

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  signal: AbortSignal,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Tool execution timed out'));
    }, timeoutMs);

    const onAbort = () => {
      clearTimeout(timer);
      reject(new Error('Tool execution aborted'));
    };

    if (signal.aborted) {
      clearTimeout(timer);
      reject(new Error('Tool execution aborted'));
      return;
    }

    signal.addEventListener('abort', onAbort, { once: true });

    promise
      .then((value) => {
        clearTimeout(timer);
        signal.removeEventListener('abort', onAbort);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        signal.removeEventListener('abort', onAbort);
        reject(error);
      });
  });
}

export async function executeTool(
  toolId: string,
  input: Record<string, unknown>,
  context: ToolContext,
  allowedTools: string[],
): Promise<ToolResult> {
  return withSpan(
    'ai.tool.invoke',
    { 'ai.tool.id': toolId, 'ai.run.id': context.agentRunId },
    async () => {
      const result = await executeToolInternal(toolId, input, context, allowedTools);
      platformMetrics.incrementToolInvocation(
        toolId,
        result.success ? 'success' : 'failed',
      );
      return result;
    },
  );
}

async function executeToolInternal(
  toolId: string,
  input: Record<string, unknown>,
  context: ToolContext,
  allowedTools: string[],
): Promise<ToolResult> {
  const startedAt = Date.now();

  if (!allowedTools.includes(toolId)) {
    return {
      success: false,
      error: {
        code: 'NOT_ALLOWED',
        message: `Tool ${toolId} is not allowed for this agent`,
        retryable: false,
      },
      durationMs: Date.now() - startedAt,
    };
  }

  const entry = getTool(toolId);
  if (!entry) {
    return {
      success: false,
      error: {
        code: 'EXECUTION_ERROR',
        message: `Tool ${toolId} is not registered`,
        retryable: false,
      },
      durationMs: Date.now() - startedAt,
    };
  }

  const validation = validateToolInput(toolId, input);
  if (!validation.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: validation.error ?? 'Invalid tool input',
        retryable: false,
      },
      durationMs: Date.now() - startedAt,
    };
  }

  const current = runConcurrency.get(context.agentRunId) ?? 0;
  if (current >= MAX_CONCURRENT_PER_RUN) {
    return {
      success: false,
      error: {
        code: 'EXECUTION_ERROR',
        message: 'Too many concurrent tool calls for this run',
        retryable: true,
      },
      durationMs: Date.now() - startedAt,
    };
  }

  runConcurrency.set(context.agentRunId, current + 1);

  try {
    const output = await withTimeout(
      entry.handler(validation.data!, context),
      entry.definition.timeout,
      context.signal,
    );

    const outputValidation = entry.definition.outputSchema.safeParse(output);
    if (!outputValidation.success) {
      const durationMs = Date.now() - startedAt;
      await logToolInvocation({
        toolId,
        agentRunId: context.agentRunId,
        userId: context.userId,
        input: validation.data!,
        error: outputValidation.error.message,
        durationMs,
        status: 'failed',
      });

      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: outputValidation.error.message,
          retryable: false,
        },
        durationMs,
      };
    }

    const durationMs = Date.now() - startedAt;
    await logToolInvocation({
      toolId,
      agentRunId: context.agentRunId,
      userId: context.userId,
      input: validation.data!,
      output: outputValidation.data as Record<string, unknown>,
      durationMs,
      status: 'success',
    });

    return {
      success: true,
      output: outputValidation.data as Record<string, unknown>,
      durationMs,
    };
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const message = error instanceof Error ? error.message : 'Tool execution failed';
    const isTimeout = message.includes('timed out');

    await logToolInvocation({
      toolId,
      agentRunId: context.agentRunId,
      userId: context.userId,
      input: validation.data!,
      error: message,
      durationMs,
      status: isTimeout ? 'timeout' : 'failed',
    });

    return {
      success: false,
      error: {
        code: isTimeout ? 'TIMEOUT' : 'EXECUTION_ERROR',
        message,
        retryable: isTimeout,
      },
      durationMs,
    };
  } finally {
    const after = runConcurrency.get(context.agentRunId) ?? 1;
    if (after <= 1) {
      runConcurrency.delete(context.agentRunId);
    } else {
      runConcurrency.set(context.agentRunId, after - 1);
    }
  }
}

export function resetToolExecutorForTests(): void {
  runConcurrency.clear();
}
