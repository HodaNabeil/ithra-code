import type { PrismaClient } from '@/generated/prisma/client';
import { prisma as appPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

import { AIPlatformConfig } from '../../infrastructure/config/ai-platform.config';
import { estimateCostUsd } from './token-pricing';

/** Platform tables are typed on the `prisma-client` generator output. */
const prisma = appPrisma as unknown as PrismaClient;

export type AgentRunStatus = 'running' | 'completed' | 'failed';

export type StartAgentRunInput = {
  runId: string;
  agentId: string;
  userId: string;
  model: string;
  provider?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
};

export type CompleteAgentRunInput = {
  runId: string;
  inputTokens: number;
  outputTokens: number;
  embeddingTokens?: number;
  latencyMs: number;
  promptVersion?: string;
  langsmithRunId?: string;
};

export async function startAgentRun(input: StartAgentRunInput): Promise<void> {
  if (!AIPlatformConfig.isEnabled()) {
    return;
  }

  try {
    await prisma.aiAgentRun.create({
      data: {
        id: input.runId,
        agentId: input.agentId,
        userId: input.userId,
        status: 'running',
        model: input.model,
        provider: input.provider ?? 'openai',
        correlationId: input.correlationId,
        metadata: input.metadata as object | undefined,
      },
    });
  } catch (error) {
    logger.warn(
      { runId: input.runId, agentId: input.agentId, error },
      '[AI_COST_LEDGER] Failed to record agent run start',
    );
  }
}

export async function completeAgentRun(input: CompleteAgentRunInput): Promise<void> {
  if (!AIPlatformConfig.isEnabled()) {
    return;
  }

  try {
    const existing = await prisma.aiAgentRun.findUnique({
      where: { id: input.runId },
      select: { model: true },
    });

    if (!existing) {
      return;
    }

    const estimatedCostUsd = estimateCostUsd(
      existing.model,
      input.inputTokens,
      input.outputTokens,
    );

    await prisma.aiAgentRun.update({
      where: { id: input.runId },
      data: {
        status: 'completed',
        inputTokens: input.inputTokens,
        outputTokens: input.outputTokens,
        embeddingTokens: input.embeddingTokens ?? 0,
        estimatedCostUsd,
        latencyMs: input.latencyMs,
        promptVersion: input.promptVersion,
        langsmithRunId: input.langsmithRunId,
        completedAt: new Date(),
      },
    });
  } catch (error) {
    logger.warn(
      { runId: input.runId, error },
      '[AI_COST_LEDGER] Failed to record agent run completion',
    );
  }
}

export async function failAgentRun(
  runId: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  if (!AIPlatformConfig.isEnabled()) {
    return;
  }

  try {
    await prisma.aiAgentRun.updateMany({
      where: { id: runId, status: 'running' },
      data: {
        status: 'failed',
        completedAt: new Date(),
        metadata: metadata as object | undefined,
      },
    });
  } catch (error) {
    logger.warn(
      { runId, error },
      '[AI_COST_LEDGER] Failed to record agent run failure',
    );
  }
}

export type CostFilters = {
  userId?: string;
  agentId?: string;
  from?: Date;
  to?: Date;
};

export type CostSummary = {
  totalRuns: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
};

export async function getCostSummary(filters: CostFilters = {}): Promise<CostSummary> {
  const runs = await prisma.aiAgentRun.findMany({
    where: {
      status: 'completed',
      userId: filters.userId,
      agentId: filters.agentId,
      createdAt: {
        gte: filters.from,
        lte: filters.to,
      },
    },
    select: {
      inputTokens: true,
      outputTokens: true,
      estimatedCostUsd: true,
    },
  });

  return runs.reduce<CostSummary>(
    (summary, run) => ({
      totalRuns: summary.totalRuns + 1,
      totalInputTokens: summary.totalInputTokens + (run.inputTokens ?? 0),
      totalOutputTokens: summary.totalOutputTokens + (run.outputTokens ?? 0),
      totalCostUsd: summary.totalCostUsd + Number(run.estimatedCostUsd ?? 0),
    }),
    {
      totalRuns: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCostUsd: 0,
    },
  );
}
