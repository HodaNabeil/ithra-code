import { randomUUID } from 'node:crypto';

import type {
  AgentRunRequest,
  AgentRunResult,
} from '../../agents/base/agent-definition';
import { getAgentDefinition } from '../../agents/definitions/agent-registry';
import type { AgentGraphState } from '../../graph/compiler/graph-compiler';
import type { RetrievedChunkState } from '../../graph/state/tutor-agent.state';
import {
  assertPlatformEnabled,
  getConversationMemoryPort,
  getEmbeddingPort,
  getLlmPort,
  getVectorSearchPort,
} from '../../infrastructure/di/ai-platform.container';
import {
  completeAgentRun,
  failAgentRun,
  startAgentRun,
} from '../../observability/cost/cost-ledger.service';
import { estimateCostUsd } from '../../observability/cost/token-pricing';
import { resolveModelForPolicy } from '../../router/model-router';
import { PlatformError, PlatformErrorCodes } from '../../shared/errors';
import type { ChatStreamEvent } from '../../shared/types';
import { agentRunRequestSchema } from '../dto/agent-run.dto';
import { buildAgentContext } from './context-builder';
import { invokeAgentGraph } from './graph-executor';
import { runGuards, runStreamGuards } from './guard-runner';
import type { RuntimeExecutionContext } from './types';
import {
  createAgentTraceSession,
  resolveLangsmithRunIdForLedger,
} from '../../observability/langsmith/langsmith-tracer';
import {
  runWithTraceContextAsync,
} from '../../observability/langsmith/trace-context';
import { withSpan } from '../../observability/opentelemetry/span-helpers';
import { platformMetrics } from '../../observability/metrics/platform-metrics';

function assertRuntimeReady(): void {
  assertPlatformEnabled();
}

function parseRequest(request: AgentRunRequest): AgentRunRequest {
  const parsed = agentRunRequestSchema.safeParse(request);
  if (!parsed.success) {
    throw new PlatformError(
      PlatformErrorCodes.VALIDATION_ERROR,
      'Invalid agent run request',
      false,
      { issues: parsed.error.issues },
    );
  }
  return parsed.data;
}

function createExecutionContext(
  agentId: string,
  request: AgentRunRequest,
): RuntimeExecutionContext {
  return {
    runId: randomUUID(),
    agentId,
    agent: getAgentDefinition(agentId),
    request,
    startedAt: Date.now(),
  };
}

function getRagPorts(agent: RuntimeExecutionContext['agent']): {
  embeddingPort?: ReturnType<typeof getEmbeddingPort>;
  vectorSearchPort?: ReturnType<typeof getVectorSearchPort>;
} {
  if (!agent.capabilities.includes('RAG')) {
    return {};
  }
  return {
    embeddingPort: getEmbeddingPort(),
    vectorSearchPort: getVectorSearchPort(),
  };
}

function getConversationMemory(
  agent: RuntimeExecutionContext['agent'],
): { conversationMemoryPort?: ReturnType<typeof getConversationMemoryPort> } {
  if (agent.memoryScope !== 'CONVERSATION') {
    return {};
  }
  return { conversationMemoryPort: getConversationMemoryPort() };
}

function extractRunOutput(finalState: AgentGraphState): {
  output: string;
  structuredOutput?: unknown;
} {
  if ('structuredOutput' in finalState && finalState.structuredOutput) {
    return {
      output: finalState.finalResponse,
      structuredOutput: finalState.structuredOutput,
    };
  }

  return { output: finalState.finalResponse };
}

export async function executeAgentRun(
  agentId: string,
  request: AgentRunRequest,
): Promise<AgentRunResult> {
  assertRuntimeReady();
  const parsed = parseRequest(request);
  const context = createExecutionContext(agentId, parsed);
  const resolved = resolveModelForPolicy(
    context.agent.defaultModelPolicy,
    parsed.options?.modelOverride,
  );

  await runGuards(context.agent, parsed.userId);

  const built = buildAgentContext(context.agent, parsed);

  await startAgentRun({
    runId: context.runId,
    agentId: context.agentId,
    userId: parsed.userId,
    model: resolved.model,
    correlationId: parsed.options?.correlationId,
    metadata: {
      courseId: parsed.scope.courseId,
      lectureId: parsed.scope.lectureId,
      promptVersion: built.promptVersion,
    },
  });

  try {
    return await runWithTraceContextAsync(
      {
        runId: context.runId,
        agentId: context.agentId,
        correlationId: parsed.options?.correlationId,
      },
      async () =>
        withSpan(
          'ai.agent.run',
          {
            'ai.agent.id': context.agentId,
            'ai.user.id': parsed.userId,
            'ai.prompt.version': built.promptVersion,
          },
          async () => {
        const trace = createAgentTraceSession(
          {
            runId: context.runId,
            agentId: context.agentId,
            userId: parsed.userId,
            courseId: parsed.scope.courseId,
            lectureId: parsed.scope.lectureId,
            promptVersion: built.promptVersion,
            correlationId: parsed.options?.correlationId,
            model: resolved.model,
          },
          { input: parsed.input },
        );

        const { finalState } = await invokeAgentGraph({
          agentId: context.agentId,
          runId: context.runId,
          state: built.initialState,
          llmPort: getLlmPort(),
          ...getRagPorts(context.agent),
          ...getConversationMemory(context.agent),
          allowedTools: context.agent.allowedTools,
          courseId: parsed.scope.courseId,
          lectureId: parsed.scope.lectureId,
          threadId: parsed.scope.threadId,
          maxTokens: parsed.options?.maxTokens ?? resolved.maxTokens,
          temperature: resolved.temperature,
          signal: parsed.options?.signal,
          callbacks: trace.callbacks,
          traceMetadata: {
            runId: context.runId,
            agentId: context.agentId,
            userId: parsed.userId,
            promptVersion: built.promptVersion,
          },
        });

        const durationMs = Date.now() - context.startedAt;
        const tokensUsed = finalState.tokensUsed ?? { input: 0, output: 0 };
        const estimatedCost = estimateCostUsd(
          resolved.model,
          tokensUsed.input,
          tokensUsed.output,
        );
        const { output, structuredOutput } = extractRunOutput(finalState);

        await trace.endTrace({
          output,
          structuredOutput,
          tokensUsed,
        });

        await completeAgentRun({
          runId: context.runId,
          inputTokens: tokensUsed.input,
          outputTokens: tokensUsed.output,
          latencyMs: durationMs,
          promptVersion: built.promptVersion,
          langsmithRunId: resolveLangsmithRunIdForLedger(),
        });

        platformMetrics.incrementAgentRun(context.agentId, 'completed');
        platformMetrics.recordAgentDuration(context.agentId, durationMs);
        platformMetrics.incrementLlmTokens(resolved.model, 'input', tokensUsed.input);
        platformMetrics.incrementLlmTokens(resolved.model, 'output', tokensUsed.output);

        return {
          runId: context.runId,
          output,
          structuredOutput,
          tokensUsed,
          estimatedCost,
          promptVersion: built.promptVersion,
          model: resolved.model,
          durationMs,
        };
          },
        ),
    );
  } catch (error) {
    await failAgentRun(context.runId, {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error instanceof PlatformError
      ? error
      : new PlatformError(
          PlatformErrorCodes.RUNTIME_ERROR,
          error instanceof Error ? error.message : 'Agent execution failed',
          false,
        );
  }
}

export async function* executeAgentStream(
  agentId: string,
  request: AgentRunRequest,
): AsyncGenerator<ChatStreamEvent> {
  assertRuntimeReady();
  const parsed = parseRequest(request);
  const context = createExecutionContext(agentId, parsed);
  const resolved = resolveModelForPolicy(
    context.agent.defaultModelPolicy,
    parsed.options?.modelOverride,
  );
  const guards = await runStreamGuards(context.agent, parsed.userId);

  const built = buildAgentContext(context.agent, parsed);

  await startAgentRun({
    runId: context.runId,
    agentId: context.agentId,
    userId: parsed.userId,
    model: resolved.model,
    correlationId: parsed.options?.correlationId,
    metadata: {
      courseId: parsed.scope.courseId,
      lectureId: parsed.scope.lectureId,
      promptVersion: built.promptVersion,
    },
  });

  yield { type: 'meta', runId: context.runId };

  type PendingEvent =
    | { kind: 'token'; text: string }
    | { kind: 'retrieval'; chunks: RetrievedChunkState[]; usedFallback: boolean };

  const pendingEvents: PendingEvent[] = [];
  let notifyToken: (() => void) | null = null;
  let graphDone = false;
  let graphError: unknown = null;
  const graphResult: { finalState: AgentGraphState | null } = { finalState: null };

  const waitForToken = () =>
    new Promise<void>((resolve) => {
      notifyToken = resolve;
    });

  const trace = createAgentTraceSession(
    {
      runId: context.runId,
      agentId: context.agentId,
      userId: parsed.userId,
      courseId: parsed.scope.courseId,
      lectureId: parsed.scope.lectureId,
      promptVersion: built.promptVersion,
      correlationId: parsed.options?.correlationId,
      model: resolved.model,
    },
    { input: parsed.input },
  );

  const graphPromise = invokeAgentGraph({
    agentId: context.agentId,
    runId: context.runId,
    state: built.initialState,
    llmPort: getLlmPort(),
    ...getRagPorts(context.agent),
    ...getConversationMemory(context.agent),
    allowedTools: context.agent.allowedTools,
    courseId: parsed.scope.courseId,
    lectureId: parsed.scope.lectureId,
    threadId: parsed.scope.threadId,
    maxTokens: parsed.options?.maxTokens ?? resolved.maxTokens,
    temperature: resolved.temperature,
    signal: parsed.options?.signal,
    callbacks: trace.callbacks,
    traceMetadata: {
      runId: context.runId,
      agentId: context.agentId,
      userId: parsed.userId,
      promptVersion: built.promptVersion,
    },
    onToken: async (token) => {
      pendingEvents.push({ kind: 'token', text: token });
      notifyToken?.();
    },
    onRetrieval: async (chunks, usedFallback) => {
      pendingEvents.push({ kind: 'retrieval', chunks, usedFallback });
      notifyToken?.();
    },
  })
    .then((result) => {
      graphResult.finalState = result.finalState;
    })
    .catch((error) => {
      graphError = error;
    })
    .finally(() => {
      graphDone = true;
      notifyToken?.();
    });

  try {
    let streamedTokenCount = 0;

    while (!graphDone || pendingEvents.length > 0) {
      if (pendingEvents.length === 0) {
        if (graphDone) {
          break;
        }
        await waitForToken();
        continue;
      }

      const event = pendingEvents.shift();
      if (!event) {
        continue;
      }
      if (event.kind === 'token') {
        streamedTokenCount += 1;
        yield { type: 'token', text: event.text };
      } else {
        yield {
          type: 'meta',
          runId: context.runId,
          sources: event.chunks.map((chunk) => ({
            id: chunk.id,
            content: chunk.content,
            score: chunk.score,
            metadata: chunk.metadata,
          })),
          usedFallback: event.usedFallback,
        };
      }
    }

    await graphPromise;

    if (graphError) {
      throw graphError;
    }

    const finalResponse = graphResult.finalState?.finalResponse?.trim();
    if (finalResponse && streamedTokenCount === 0) {
      yield { type: 'token', text: finalResponse };
    }

    const durationMs = Date.now() - context.startedAt;
    const usage = graphResult.finalState?.tokensUsed ?? { input: 0, output: 0 };

    await trace.endTrace({
      output: graphResult.finalState?.finalResponse,
      tokensUsed: usage,
    });

    await completeAgentRun({
      runId: context.runId,
      inputTokens: usage.input,
      outputTokens: usage.output,
      latencyMs: durationMs,
      promptVersion: built.promptVersion,
      langsmithRunId: resolveLangsmithRunIdForLedger(),
    });

    yield {
      type: 'done',
      usage: {
        promptTokens: usage.input,
        completionTokens: usage.output,
        totalTokens: usage.input + usage.output,
        estimatedCostUsd: estimateCostUsd(
          resolved.model,
          usage.input,
          usage.output,
        ),
      },
    };
  } catch (error) {
    await trace.endTrace(undefined, error instanceof Error ? error.message : 'Unknown error');
    await failAgentRun(context.runId, {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const mapped =
      error instanceof PlatformError
        ? error
        : new PlatformError(
            PlatformErrorCodes.RUNTIME_ERROR,
            error instanceof Error ? error.message : 'Agent stream failed',
            false,
          );

    yield {
      type: 'error',
      code: mapped.code,
      message: mapped.message,
      retryable: mapped.retryable,
    };
  } finally {
    await guards.releaseConcurrencySlot?.();
  }
}
