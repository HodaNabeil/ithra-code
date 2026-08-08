import type { PrismaClient } from '@/generated/prisma/client';
import { prisma as appPrisma } from '@/lib/prisma';

import {
  addSlice,
  type UsageBreakdowns,
} from './aggregation.utils';

const prisma = appPrisma as unknown as PrismaClient;

export type { UsageSlice, UsageBreakdowns } from './aggregation.utils';

export type DailyAggregationResult = {
  date: string;
  rowsUpserted: number;
};

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfUtcDay(date: Date): Date {
  const start = startOfUtcDay(date);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

type GroupKey = {
  userId: string | null;
  agentId: string | null;
};

function groupKeyToString(key: GroupKey): string {
  return `${key.userId ?? 'global'}:${key.agentId ?? 'all'}`;
}

export async function aggregateUsageForDate(date: Date): Promise<DailyAggregationResult> {
  const dayStart = startOfUtcDay(date);
  const dayEnd = endOfUtcDay(date);

  const runs = await prisma.aiAgentRun.findMany({
    where: {
      status: 'completed',
      completedAt: {
        gte: dayStart,
        lte: dayEnd,
      },
    },
    select: {
      userId: true,
      agentId: true,
      provider: true,
      model: true,
      inputTokens: true,
      outputTokens: true,
      estimatedCostUsd: true,
    },
  });

  const groups = new Map<
    string,
    {
      key: GroupKey;
      totalRuns: number;
      totalInputTokens: number;
      totalOutputTokens: number;
      totalCostUsd: number;
      breakdowns: UsageBreakdowns;
    }
  >();

  const ensureGroup = (key: GroupKey) => {
    const id = groupKeyToString(key);
    if (!groups.has(id)) {
      groups.set(id, {
        key,
        totalRuns: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCostUsd: 0,
        breakdowns: { byProvider: {}, byModel: {}, byAgent: {} },
      });
    }
    return groups.get(id)!;
  };

  for (const run of runs) {
    const keys: GroupKey[] = [
      { userId: run.userId, agentId: run.agentId },
      { userId: run.userId, agentId: null },
      { userId: null, agentId: run.agentId },
      { userId: null, agentId: null },
    ];

    for (const key of keys) {
      const group = ensureGroup(key);
      group.totalRuns += 1;
      group.totalInputTokens += run.inputTokens ?? 0;
      group.totalOutputTokens += run.outputTokens ?? 0;
      group.totalCostUsd += Number(run.estimatedCostUsd ?? 0);
      addSlice(group.breakdowns.byProvider, run.provider, run);
      addSlice(group.breakdowns.byModel, run.model, run);
      addSlice(group.breakdowns.byAgent, run.agentId, run);
    }
  }

  let rowsUpserted = 0;
  for (const group of groups.values()) {
    const data = {
      totalRuns: group.totalRuns,
      totalInputTokens: BigInt(group.totalInputTokens),
      totalOutputTokens: BigInt(group.totalOutputTokens),
      totalCostUsd: group.totalCostUsd,
      breakdowns: group.breakdowns,
    };

    const existing = await prisma.aiUsageDaily.findFirst({
      where: {
        date: dayStart,
        userId: group.key.userId,
        agentId: group.key.agentId,
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.aiUsageDaily.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await prisma.aiUsageDaily.create({
        data: {
          date: dayStart,
          userId: group.key.userId,
          agentId: group.key.agentId,
          ...data,
        },
      });
    }

    rowsUpserted += 1;
  }

  return {
    date: dayStart.toISOString().slice(0, 10),
    rowsUpserted,
  };
}

export async function aggregateIncrementalUsage(): Promise<DailyAggregationResult[]> {
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const results = await Promise.all([
    aggregateUsageForDate(yesterday),
    aggregateUsageForDate(today),
  ]);
  return results;
}
