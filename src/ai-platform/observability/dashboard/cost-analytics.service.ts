import type { PrismaClient } from '@/generated/prisma/client';
import { prisma as appPrisma } from '@/lib/prisma';

const prisma = appPrisma as unknown as PrismaClient;

export type AnalyticsFilters = {
  userId?: string;
  agentId?: string;
  provider?: string;
  model?: string;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
};

function buildRunWhere(filters: AnalyticsFilters) {
  return {
    status: 'completed' as const,
    userId: filters.userId,
    agentId: filters.agentId,
    provider: filters.provider,
    model: filters.model,
    createdAt: {
      gte: filters.from,
      lte: filters.to,
    },
  };
}

export async function getCostSummaryAnalytics(filters: AnalyticsFilters = {}) {
  const runs = await prisma.aiAgentRun.findMany({
    where: buildRunWhere(filters),
    select: {
      inputTokens: true,
      outputTokens: true,
      estimatedCostUsd: true,
    },
  });

  return runs.reduce(
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

export async function listAgentRuns(filters: AnalyticsFilters = {}) {
  const page = Math.max(filters.page ?? 1, 1);
  const limit = Math.min(Math.max(filters.limit ?? 50, 1), 200);
  const skip = (page - 1) * limit;
  const where = buildRunWhere(filters);

  const [items, total] = await Promise.all([
    prisma.aiAgentRun.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.aiAgentRun.count({ where }),
  ]);

  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getUsageByProvider(filters: AnalyticsFilters = {}) {
  const runs = await prisma.aiAgentRun.groupBy({
    by: ['provider'],
    where: buildRunWhere(filters),
    _count: { _all: true },
    _sum: {
      inputTokens: true,
      outputTokens: true,
      estimatedCostUsd: true,
    },
  });

  return runs.map((row) => ({
    provider: row.provider,
    totalRuns: row._count._all,
    totalInputTokens: row._sum.inputTokens ?? 0,
    totalOutputTokens: row._sum.outputTokens ?? 0,
    totalCostUsd: Number(row._sum.estimatedCostUsd ?? 0),
  }));
}

export async function getUsageByModel(filters: AnalyticsFilters = {}) {
  const runs = await prisma.aiAgentRun.groupBy({
    by: ['model'],
    where: buildRunWhere(filters),
    _count: { _all: true },
    _sum: {
      inputTokens: true,
      outputTokens: true,
      estimatedCostUsd: true,
    },
  });

  return runs.map((row) => ({
    model: row.model,
    totalRuns: row._count._all,
    totalInputTokens: row._sum.inputTokens ?? 0,
    totalOutputTokens: row._sum.outputTokens ?? 0,
    totalCostUsd: Number(row._sum.estimatedCostUsd ?? 0),
  }));
}

export async function getDailyUsageAnalytics(filters: AnalyticsFilters = {}) {
  return prisma.aiUsageDaily.findMany({
    where: {
      userId: filters.userId,
      agentId: filters.agentId,
      date: {
        gte: filters.from,
        lte: filters.to,
      },
    },
    orderBy: { date: 'desc' },
    take: filters.limit ?? 100,
  });
}
