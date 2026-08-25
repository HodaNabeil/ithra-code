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
import { computeRunCostUsd } from '../../observability/cost/token-pricing';
import { resolveModelForPolicy } from '../../router/model-router';
import { AIPlatformConfig } from '../../infrastructure/config/ai-platform.config';
import {
  reconcileDailyBudgetUsd,
  releaseDailyBudgetReservation,
} from '../../infrastructure/guards';
import { readExecutionPolicy } from '../../graph/state/shared-channels';
import { PlatformError, PlatformErrorCodes } from '../../shared/errors';
import type { ChatStreamEvent } from '../../shared/types';
import { agentRunRequestSchema } from '../dto/agent-run.dto';
import { buildAgentContext } from './context-builder';
import { invokeAgentGraph, streamAgentGraph } from './graph-executor';
import {
  extractGraphInjectionPorts,
  extractRunMetadata,
} from './graph-port-extractor';
import {
  runGuards,
  runStreamGuards,
  type GuardChainResult,
} from './guard-runner';
import type { RuntimeExecutionContext } from './types';
import {
  createAgentTraceSession,
  resolveLangsmithRunIdForLedger,
} from '../../observability/langsmith/langsmith-tracer';
import {
  runWithTraceContext,
  runWithTraceContextAsync,
} from '../../observability/langsmith/trace-context';
import {
  withSpan,
  getTracer,
  isOtelActive,
  runInSpanContextAsync,
} from '../../observability/opentelemetry/span-helpers';
import {
  buildAgentRunSpanAttributes,
  buildLedgerCompleteSpanAttributes,
  setSafeSpanAttributes,
} from '../../observability/opentelemetry/otel-attributes';
import {
  readRunTokenUsageEstimated,
  readActualModelFromRunSignals,
  readActualProviderFromRunSignals,
} from '../../observability/usage';
import {
  logAgentRunCompleted,
  logAgentRunFailed,
} from '../../observability/logging';
import { getProviderForModel } from '../../providers/registry/provider-registry';
import { platformMetrics } from '../../observability/metrics/platform-metrics';
import { LiveStreamGuard } from './live-stream-guard';

function resolveErrorCode(error: unknown): string {
  return error instanceof PlatformError
    ? error.code
    : PlatformErrorCodes.RUNTIME_ERROR;
}

function recordSuccessfulAgentRun(params: {
  context: RuntimeExecutionContext;
  parsed: AgentRunRequest;
  billing: { model: string; provider: string };
  tokensUsed: { input: number; output: number };
  embeddingTokensUsed: number;
  tokenUsageEstimated: boolean;
  estimatedCost: number;
  durationMs: number;
}): void {
  platformMetrics.recordRunOutcome({
    agentId: params.context.agentId,
    model: params.billing.model,
    provider: params.billing.provider,
    embeddingModel: AIPlatformConfig.getEmbeddingConfig().model,
    durationMs: params.durationMs,
    inputTokens: params.tokensUsed.input,
    outputTokens: params.tokensUsed.output,
    embeddingTokens: params.embeddingTokensUsed,
    costUsd: params.estimatedCost,
  });

  logAgentRunCompleted({
    runId: params.context.runId,
    agentId: params.context.agentId,
    correlationId: params.parsed.options?.correlationId,
    model: params.billing.model,
    provider: params.billing.provider,
    inputTokens: params.tokensUsed.input,
    outputTokens: params.tokensUsed.output,
    embeddingTokens: params.embeddingTokensUsed,
    costUsd: params.estimatedCost,
    durationMs: params.durationMs,
    tokenUsageEstimated: params.tokenUsageEstimated,
  });
}

function recordFailedAgentRun(params: {
  context: RuntimeExecutionContext;
  parsed: AgentRunRequest;
  error: unknown;
  durationMs?: number;
}): void {
  const errorCode = resolveErrorCode(params.error);

  platformMetrics.incrementAgentRun(params.context.agentId, 'failed');
  platformMetrics.incrementRequestError(params.context.agentId, errorCode);

  logAgentRunFailed({
    runId: params.context.runId,
    agentId: params.context.agentId,
    correlationId: params.parsed.options?.correlationId,
    durationMs: params.durationMs ?? Date.now() - params.context.startedAt,
    errorCode,
  });
}

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

function getConversationMemory(agent: RuntimeExecutionContext['agent']): {
  conversationMemoryPort?: ReturnType<typeof getConversationMemoryPort>;
} {
  if (agent.memoryScope !== 'CONVERSATION') {
    return {};
  }
  return { conversationMemoryPort: getConversationMemoryPort() };
}

function extractGraphPorts(metadata: Record<string, unknown> | undefined) {
  return extractGraphInjectionPorts(metadata);
}

function computeFinalRunCost(
  resolvedModel: string,
  tokensUsed: { input: number; output: number },
  embeddingTokensUsed: number,
): number {
  return computeRunCostUsd({
    model: resolvedModel,
    inputTokens: tokensUsed.input,
    outputTokens: tokensUsed.output,
    embeddingModel: AIPlatformConfig.getEmbeddingConfig().model,
    embeddingTokens: embeddingTokensUsed,
  });
}

function readRunSignals(
  finalState: AgentGraphState,
): Record<string, unknown> | undefined {
  return 'runSignals' in finalState
    ? (finalState.runSignals as Record<string, unknown> | undefined)
    : undefined;
}

function readBillingContextFromState(
  finalState: AgentGraphState,
  resolved: { model: string; provider: string },
): { model: string; provider: string } {
  const runSignals = readRunSignals(finalState);
  const model = readActualModelFromRunSignals(runSignals) ?? resolved.model;
  const provider =
    readActualProviderFromRunSignals(runSignals) ?? getProviderForModel(model);

  return { model, provider };
}

function readTokenUsageFromState(finalState: AgentGraphState): {
  tokensUsed: { input: number; output: number };
  tokenUsageEstimated: boolean;
} {
  const tokensUsed = finalState.tokensUsed ?? { input: 0, output: 0 };
  const tokenUsageEstimated = readRunTokenUsageEstimated(
    readRunSignals(finalState),
  );

  return { tokensUsed, tokenUsageEstimated };
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

async function recordLedgerComplete(params: {
  runId: string;
  agentId: string;
  inputTokens: number;
  outputTokens: number;
  embeddingTokens: number;
  tokenUsageEstimated: boolean;
  actualModel: string;
  actualProvider: string;
  estimatedCostUsd: number;
  latencyMs: number;
  promptVersion?: string;
  langsmithRunId?: string;
}): Promise<void> {
  await withSpan(
    'ai.ledger.complete',
    buildLedgerCompleteSpanAttributes({
      runId: params.runId,
      agentId: params.agentId,
      model: params.actualModel,
      provider: params.actualProvider,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      embeddingTokens: params.embeddingTokens,
      estimatedCostUsd: params.estimatedCostUsd,
      tokenUsageEstimated: params.tokenUsageEstimated,
      latencyMs: params.latencyMs,
    }),
    async () =>
      completeAgentRun({
        runId: params.runId,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
        embeddingTokens: params.embeddingTokens,
        tokenUsageEstimated: params.tokenUsageEstimated,
        actualModel: params.actualModel,
        actualProvider: params.actualProvider,
        latencyMs: params.latencyMs,
        promptVersion: params.promptVersion,
        langsmithRunId: params.langsmithRunId,
      }),
  );
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

  const maxTokens = parsed.options?.maxTokens ?? resolved.maxTokens;
  const built = buildAgentContext(context.agent, parsed);
  let guards: GuardChainResult = {};

  await startAgentRun({
    runId: context.runId,
    agentId: context.agentId,
    userId: parsed.userId,
    model: resolved.model,
    provider: resolved.provider,
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
          buildAgentRunSpanAttributes({
            agentId: context.agentId,
            runId: context.runId,
            userId: parsed.userId,
            correlationId: parsed.options?.correlationId,
            promptVersion: built.promptVersion,
            mode: 'execute',
          }),
          async () => {
            guards = await runGuards(context.agent, parsed.userId, {
              model: resolved.model,
              maxTokens,
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

            const { finalState } = await invokeAgentGraph({
              agentId: context.agentId,
              runId: context.runId,
              state: built.initialState,
              llmPort: getLlmPort(),
              ...getRagPorts(context.agent),
              ...getConversationMemory(context.agent),
              ...extractGraphPorts(parsed.options?.metadata),
              allowedTools: context.agent.allowedTools,
              courseId: parsed.scope.courseId,
              lectureId: parsed.scope.lectureId,
              threadId: parsed.scope.threadId,
              maxTokens: parsed.options?.maxTokens ?? resolved.maxTokens,
              temperature: resolved.temperature,
              model: resolved.model,
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
            const { tokensUsed, tokenUsageEstimated } =
              readTokenUsageFromState(finalState);
            const embeddingTokensUsed = finalState.embeddingTokensUsed ?? 0;
            const billing = readBillingContextFromState(finalState, resolved);
            const estimatedCost = computeFinalRunCost(
              billing.model,
              tokensUsed,
              embeddingTokensUsed,
            );
            const { output, structuredOutput } = extractRunOutput(finalState);

            await trace.endTrace({
              output,
              structuredOutput,
              tokensUsed,
            });

            await recordLedgerComplete({
              runId: context.runId,
              agentId: context.agentId,
              inputTokens: tokensUsed.input,
              outputTokens: tokensUsed.output,
              embeddingTokens: embeddingTokensUsed,
              tokenUsageEstimated,
              actualModel: billing.model,
              actualProvider: billing.provider,
              estimatedCostUsd: estimatedCost,
              latencyMs: durationMs,
              promptVersion: built.promptVersion,
              langsmithRunId: resolveLangsmithRunIdForLedger(),
            });

            await reconcileDailyBudgetUsd({
              userId: parsed.userId,
              reservedMicroUsd: guards.budgetReservation?.reservedMicroUsd ?? 0,
              actualUsd: estimatedCost,
            });

            recordSuccessfulAgentRun({
              context,
              parsed,
              billing,
              tokensUsed,
              embeddingTokensUsed,
              tokenUsageEstimated,
              estimatedCost,
              durationMs,
            });

            return {
              runId: context.runId,
              output,
              structuredOutput,
              tokensUsed: {
                input: tokensUsed.input,
                output: tokensUsed.output,
                embedding: embeddingTokensUsed,
                totalTokens: tokensUsed.input + tokensUsed.output,
                tokenUsageEstimated,
              },
              estimatedCost,
              promptVersion: built.promptVersion,
              model: billing.model,
              durationMs,
            };
          },
        ),
    );
  } catch (error) {
    await releaseDailyBudgetReservation(guards.budgetReservation ?? null);
    recordFailedAgentRun({ context, parsed, error });
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
  const traceContext = {
    runId: context.runId,
    agentId: context.agentId,
    correlationId: parsed.options?.correlationId,
  };

  const stream = runWithTraceContext(traceContext, () =>
    executeAgentStreamCore(context, parsed),
  );

  yield* stream;
}

async function* executeAgentStreamCore(
  context: RuntimeExecutionContext,
  parsed: AgentRunRequest,
): AsyncGenerator<ChatStreamEvent> {
  const resolved = resolveModelForPolicy(
    context.agent.defaultModelPolicy,
    parsed.options?.modelOverride,
  );
  const maxTokens = parsed.options?.maxTokens ?? resolved.maxTokens;
  const built = buildAgentContext(context.agent, parsed);
  let guards: GuardChainResult = {};

  await startAgentRun({
    runId: context.runId,
    agentId: context.agentId,
    userId: parsed.userId,
    model: resolved.model,
    provider: resolved.provider,
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
    | {
        kind: 'retrieval';
        chunks: RetrievedChunkState[];
        usedFallback: boolean;
      };

  const pendingEvents: PendingEvent[] = [];
  let notifyToken: (() => void) | null = null;
  let graphDone = false;
  let graphError: unknown = null;
  const graphResult: { finalState: AgentGraphState | null } = {
    finalState: null,
  };

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

  let latestObservedState: AgentGraphState = built.initialState;
  const liveStreamGuard = new LiveStreamGuard();

  const span = isOtelActive()
    ? getTracer().startSpan('ai.agent.run', {
        attributes: buildAgentRunSpanAttributes({
          agentId: context.agentId,
          runId: context.runId,
          userId: parsed.userId,
          correlationId: parsed.options?.correlationId,
          promptVersion: built.promptVersion,
          mode: 'stream',
        }),
      })
    : null;

  try {
    if (span) {
      guards = await runInSpanContextAsync(span, () =>
        runStreamGuards(context.agent, parsed.userId, {
          model: resolved.model,
          maxTokens,
        }),
      );
    } else {
      guards = await runStreamGuards(context.agent, parsed.userId, {
        model: resolved.model,
        maxTokens,
      });
    }

    const streamGraphInput = {
      agentId: context.agentId,
      runId: context.runId,
      state: built.initialState,
      llmPort: getLlmPort(),
      ...getRagPorts(context.agent),
      ...getConversationMemory(context.agent),
      ...extractGraphPorts(parsed.options?.metadata),
      allowedTools: context.agent.allowedTools,
      courseId: parsed.scope.courseId,
      lectureId: parsed.scope.lectureId,
      threadId: parsed.scope.threadId,
      maxTokens: parsed.options?.maxTokens ?? resolved.maxTokens,
      temperature: resolved.temperature,
      model: resolved.model,
      signal: parsed.options?.signal,
      callbacks: trace.callbacks,
      traceMetadata: {
        runId: context.runId,
        agentId: context.agentId,
        userId: parsed.userId,
        promptVersion: built.promptVersion,
      },
      onStateUpdate: (state: AgentGraphState) => {
        latestObservedState = state;
      },
      onToken: async (token: string) => {
        if (readExecutionPolicy(latestObservedState) !== 'LIVE') {
          notifyToken?.();
          return;
        }

        const { emit, blocked } = liveStreamGuard.push(token);
        if (blocked) {
          notifyToken?.();
          return;
        }

        if (emit) {
          pendingEvents.push({ kind: 'token', text: emit });
        }
        notifyToken?.();
      },
      onRetrieval: async (
        chunks: RetrievedChunkState[],
        usedFallback: boolean,
      ) => {
        pendingEvents.push({ kind: 'retrieval', chunks, usedFallback });
        notifyToken?.();
      },
    };

    const graphPromise = (
      span
        ? runInSpanContextAsync(span, () => streamAgentGraph(streamGraphInput))
        : streamAgentGraph(streamGraphInput)
    )
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

    let streamedTokenCount = 0;
    let firstTokenEmittedAt: number | undefined;

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
        if (firstTokenEmittedAt === undefined) {
          firstTokenEmittedAt = Date.now();
          if (span) {
            setSafeSpanAttributes(span, {
              'ai.stream.time_to_first_token_ms':
                firstTokenEmittedAt - context.startedAt,
            });
          }
        }
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
    const executionPolicy = readExecutionPolicy(graphResult.finalState);

    if (
      finalResponse &&
      (executionPolicy === 'BUFFERED' || streamedTokenCount === 0)
    ) {
      yield { type: 'token', text: finalResponse };
    } else if (liveStreamGuard.isBlocked() && finalResponse) {
      yield { type: 'replace', text: finalResponse };
    } else {
      const tail = liveStreamGuard.flush();
      if (tail) {
        yield { type: 'token', text: tail };
      }
    }

    const durationMs = Date.now() - context.startedAt;
    const { tokensUsed: usage, tokenUsageEstimated } = readTokenUsageFromState(
      graphResult.finalState ?? ({} as AgentGraphState),
    );
    const embeddingTokensUsed =
      graphResult.finalState?.embeddingTokensUsed ?? 0;
    const billing = readBillingContextFromState(
      graphResult.finalState ?? ({} as AgentGraphState),
      resolved,
    );
    const estimatedCost = computeFinalRunCost(
      billing.model,
      usage,
      embeddingTokensUsed,
    );

    await trace.endTrace({
      output: graphResult.finalState?.finalResponse,
      tokensUsed: usage,
    });

    const recordLedger = () =>
      recordLedgerComplete({
        runId: context.runId,
        agentId: context.agentId,
        inputTokens: usage.input,
        outputTokens: usage.output,
        embeddingTokens: embeddingTokensUsed,
        tokenUsageEstimated,
        actualModel: billing.model,
        actualProvider: billing.provider,
        estimatedCostUsd: estimatedCost,
        latencyMs: durationMs,
        promptVersion: built.promptVersion,
        langsmithRunId: resolveLangsmithRunIdForLedger(),
      });

    if (span) {
      await runInSpanContextAsync(span, recordLedger);
    } else {
      await recordLedger();
    }

    await reconcileDailyBudgetUsd({
      userId: parsed.userId,
      reservedMicroUsd: guards.budgetReservation?.reservedMicroUsd ?? 0,
      actualUsd: estimatedCost,
    });

    recordSuccessfulAgentRun({
      context,
      parsed,
      billing,
      tokensUsed: usage,
      embeddingTokensUsed,
      tokenUsageEstimated,
      estimatedCost,
      durationMs,
    });

    yield {
      type: 'done',
      output: graphResult.finalState?.finalResponse,
      metadata: extractRunMetadata(
        graphResult.finalState as unknown as
          | Record<string, unknown>
          | undefined,
      ),
      usage: {
        promptTokens: usage.input,
        completionTokens: usage.output,
        totalTokens: usage.input + usage.output,
        estimatedCostUsd: estimatedCost,
        tokenUsageEstimated,
      },
    };
    span?.setStatus({ code: 1 });
  } catch (error) {
    if (parsed.options?.signal?.aborted) {
      platformMetrics.incrementStreamAbort(context.agentId);
    }
    await releaseDailyBudgetReservation(guards.budgetReservation ?? null);
    span?.recordException(error as Error);
    span?.setStatus({
      code: 2,
      message: error instanceof Error ? error.message : 'error',
    });
    recordFailedAgentRun({
      context,
      parsed,
      error,
      durationMs: Date.now() - context.startedAt,
    });
    await trace.endTrace(
      undefined,
      error instanceof Error ? error.message : 'Unknown error',
    );
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
    span?.end();
    await guards.releaseConcurrencySlot?.();
  }
}
