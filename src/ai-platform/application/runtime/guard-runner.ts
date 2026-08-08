import type { AgentDefinition } from '../../agents/base/agent-definition';
import { AIPlatformConfig } from '../../infrastructure/config/ai-platform.config';
import {
  assertMessageRateLimit,
  acquireConcurrencySlot,
  reserveDailyBudgetUsd,
  type BudgetReservation,
} from '../../infrastructure/guards';
import { computeRunCostUsd } from '../../observability/cost/token-pricing';
import { withSpan } from '../../observability/opentelemetry/span-helpers';
import { PlatformError, PlatformErrorCodes } from '../../shared/errors';

export type GuardChainResult = {
  releaseConcurrencySlot?: () => Promise<void>;
  budgetReservation?: BudgetReservation | null;
};

function estimateMaxRunCostUsd(model: string, maxTokens: number): number {
  return computeRunCostUsd({
    model,
    inputTokens: 4_000,
    outputTokens: maxTokens,
    embeddingModel: AIPlatformConfig.getEmbeddingConfig().model,
    embeddingTokens: 500,
  });
}

async function runBaseGuards(
  agent: AgentDefinition,
  userId: string,
  estimatedMaxCostUsd: number,
): Promise<BudgetReservation | null> {
  const rateLimits = AIPlatformConfig.getRateLimitConfig();
  const scope = `agent:${agent.id}`;

  await withSpan(
    'ai.guard.rate-limit',
    {
      'ai.agent.id': agent.id,
      'ai.guard.scope': scope,
    },
    async () =>
      assertMessageRateLimit({
        userId,
        limits: rateLimits,
        scope,
      }),
  );

  return withSpan(
    'ai.guard.budget',
    {
      'ai.agent.id': agent.id,
      'ai.budget.estimated_usd': estimatedMaxCostUsd,
    },
    async () =>
      reserveDailyBudgetUsd({
        userId,
        estimatedUsd: estimatedMaxCostUsd,
        userCapUsd: AIPlatformConfig.getUserDailyBudgetUsd(),
        globalCapUsd: AIPlatformConfig.getGlobalDailyBudgetUsd(),
      }),
  );
}

export async function runGuards(
  agent: AgentDefinition,
  userId: string,
  options?: { model: string; maxTokens: number },
): Promise<GuardChainResult> {
  try {
    const estimatedMaxCostUsd = options
      ? estimateMaxRunCostUsd(options.model, options.maxTokens)
      : 0.05;
    const budgetReservation = await runBaseGuards(
      agent,
      userId,
      estimatedMaxCostUsd,
    );
    return { budgetReservation };
  } catch (error) {
    if (error instanceof PlatformError) {
      throw error;
    }
    throw new PlatformError(
      PlatformErrorCodes.RUNTIME_ERROR,
      'Guard chain failed',
      false,
    );
  }
}

export async function runStreamGuards(
  agent: AgentDefinition,
  userId: string,
  options?: { model: string; maxTokens: number },
): Promise<GuardChainResult> {
  try {
    const estimatedMaxCostUsd = options
      ? estimateMaxRunCostUsd(options.model, options.maxTokens)
      : 0.05;
    const budgetReservation = await runBaseGuards(
      agent,
      userId,
      estimatedMaxCostUsd,
    );

    const streamConfig = AIPlatformConfig.getStreamConfig();
    const releaseConcurrencySlot = await acquireConcurrencySlot({
      userId,
      maxConcurrent:
        agent.guards.maxConcurrentStreams ??
        streamConfig.maxConcurrentStreamsPerUser,
      timeoutMs: streamConfig.requestTimeoutMs,
      scope: `agent:${agent.id}`,
    });

    return { releaseConcurrencySlot, budgetReservation };
  } catch (error) {
    if (error instanceof PlatformError) {
      throw error;
    }
    throw new PlatformError(
      PlatformErrorCodes.RUNTIME_ERROR,
      'Guard chain failed',
      false,
    );
  }
}
