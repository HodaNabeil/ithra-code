import type { PrismaClient } from '@/generated/prisma/client';
import { prisma as appPrisma } from '@/lib/prisma';

import { type AnalyticsFilters, computeErrorRate } from './analytics-filters';

const prisma = appPrisma as unknown as PrismaClient;

export type {
  AnalyticsFilters,
  AnalyticsFiltersInput,
} from './analytics-filters';
export {
  normalizeAnalyticsFilters,
  parseAnalyticsFiltersFromRequest,
} from './analytics-filters';

export type AnalyticsOverview = {
  totalRequests: number;
  completedRequests: number;
  failedRequests: number;
  runningRequests: number;
  errorRate: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  avgCostPerRequestUsd: number;
  avgLatencyMs: number | null;
};

export type ModelBreakdownRow = {
  model: string;
  provider: string;
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  errorRate: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  avgLatencyMs: number | null;
};

export type DailyTrendPoint = {
  date: string;
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
};

function buildBaseWhere(filters: AnalyticsFilters) {
  return {
    userId: filters.userId,
    agentId: filters.agentId,
    provider: filters.provider,
    model: filters.model,
    tokenUsageEstimated: filters.tokenUsageEstimated,
    status: filters.status,
    createdAt: {
      gte: filters.from,
      lte: filters.to,
    },
  };
}

function buildCompletedRunWhere(filters: AnalyticsFilters) {
  return {
    ...buildBaseWhere(filters),
    status: 'completed' as const,
  };
}

function buildTerminalRunWhere(filters: AnalyticsFilters) {
  return {
    ...buildBaseWhere({ ...filters, status: undefined }),
    status: { in: ['completed', 'failed'] as Array<'completed' | 'failed'> },
  };
}

export async function getOverviewAnalytics(
  filters: AnalyticsFilters = {},
): Promise<AnalyticsOverview> {
  const baseWhere = buildBaseWhere(filters);

  const [completedAggregate, statusCounts, latencyAggregate] =
    await Promise.all([
      prisma.aiAgentRun.aggregate({
        where: buildCompletedRunWhere(filters),
        _count: { _all: true },
        _sum: {
          inputTokens: true,
          outputTokens: true,
          estimatedCostUsd: true,
        },
      }),
      prisma.aiAgentRun.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: { _all: true },
      }),
      prisma.aiAgentRun.aggregate({
        where: {
          ...buildTerminalRunWhere(filters),
          latencyMs: { not: null },
        },
        _avg: { latencyMs: true },
      }),
    ]);

  const completedRequests =
    statusCounts.find((row) => row.status === 'completed')?._count._all ?? 0;
  const failedRequests =
    statusCounts.find((row) => row.status === 'failed')?._count._all ?? 0;
  const runningRequests =
    statusCounts.find((row) => row.status === 'running')?._count._all ?? 0;
  const totalRequests = completedRequests + failedRequests + runningRequests;

  const totalInputTokens = completedAggregate._sum.inputTokens ?? 0;
  const totalOutputTokens = completedAggregate._sum.outputTokens ?? 0;
  const totalCostUsd = Number(completedAggregate._sum.estimatedCostUsd ?? 0);
  const avgCostPerRequestUsd =
    completedRequests > 0 ? totalCostUsd / completedRequests : 0;

  return {
    totalRequests,
    completedRequests,
    failedRequests,
    runningRequests,
    errorRate: computeErrorRate(completedRequests, failedRequests),
    totalInputTokens,
    totalOutputTokens,
    totalCostUsd,
    avgCostPerRequestUsd,
    avgLatencyMs: latencyAggregate._avg?.latencyMs ?? null,
  };
}

export async function getCostSummaryAnalytics(filters: AnalyticsFilters = {}) {
  const runs = await prisma.aiAgentRun.findMany({
    where: buildCompletedRunWhere(filters),
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
  const where = buildBaseWhere(filters);

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
    where: buildCompletedRunWhere(filters),
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
    where: buildCompletedRunWhere(filters),
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

export async function getModelBreakdownAnalytics(
  filters: AnalyticsFilters = {},
): Promise<ModelBreakdownRow[]> {
  const baseWhere = buildBaseWhere(filters);

  const [statusRows, latencyRows] = await Promise.all([
    prisma.aiAgentRun.groupBy({
      by: ['model', 'provider', 'status'],
      where: baseWhere,
      _count: { _all: true },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        estimatedCostUsd: true,
      },
    }),
    prisma.aiAgentRun.groupBy({
      by: ['model', 'provider'],
      where: {
        ...buildTerminalRunWhere(filters),
        latencyMs: { not: null },
      },
      _avg: { latencyMs: true },
    }),
  ]);

  const latencyByKey = new Map(
    latencyRows.map((row) => [
      `${row.model}::${row.provider}`,
      row._avg?.latencyMs ?? null,
    ]),
  );

  const grouped = new Map<string, ModelBreakdownRow>();

  for (const row of statusRows) {
    const key = `${row.model}::${row.provider}`;
    const existing = grouped.get(key) ?? {
      model: row.model,
      provider: row.provider,
      totalRuns: 0,
      completedRuns: 0,
      failedRuns: 0,
      errorRate: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCostUsd: 0,
      avgLatencyMs: latencyByKey.get(key) ?? null,
    };

    existing.totalRuns += row._count._all;

    if (row.status === 'completed') {
      existing.completedRuns += row._count._all;
      existing.totalInputTokens += row._sum.inputTokens ?? 0;
      existing.totalOutputTokens += row._sum.outputTokens ?? 0;
      existing.totalCostUsd += Number(row._sum.estimatedCostUsd ?? 0);
    }

    if (row.status === 'failed') {
      existing.failedRuns += row._count._all;
    }

    grouped.set(key, existing);
  }

  return [...grouped.values()]
    .map((row) => ({
      ...row,
      errorRate: computeErrorRate(row.completedRuns, row.failedRuns),
    }))
    .sort((left, right) => right.totalCostUsd - left.totalCostUsd);
}

export async function getDailyTrendAnalytics(
  filters: AnalyticsFilters = {},
): Promise<DailyTrendPoint[]> {
  const [usageRows, statusRuns] = await Promise.all([
    prisma.aiUsageDaily.findMany({
      where: {
        userId: filters.userId ?? null,
        agentId: filters.agentId ?? null,
        date: {
          gte: filters.from,
          lte: filters.to,
        },
      },
      orderBy: { date: 'asc' },
    }),
    prisma.aiAgentRun.findMany({
      where: {
        ...buildBaseWhere({ ...filters, status: undefined }),
        status: {
          in: ['completed', 'failed'] as Array<'completed' | 'failed'>,
        },
        createdAt: {
          gte: filters.from,
          lte: filters.to,
        },
      },
      select: {
        createdAt: true,
        status: true,
      },
    }),
  ]);

  const completedByDate = new Map<string, number>();
  const failedByDate = new Map<string, number>();

  for (const run of statusRuns) {
    const dateKey = run.createdAt.toISOString().slice(0, 10);
    if (run.status === 'failed') {
      failedByDate.set(dateKey, (failedByDate.get(dateKey) ?? 0) + 1);
      continue;
    }

    completedByDate.set(dateKey, (completedByDate.get(dateKey) ?? 0) + 1);
  }

  const usageByDate = new Map(
    usageRows.map((row) => [
      row.date.toISOString().slice(0, 10),
      {
        totalInputTokens: Number(row.totalInputTokens),
        totalOutputTokens: Number(row.totalOutputTokens),
        totalCostUsd: Number(row.totalCostUsd),
        totalRuns: row.totalRuns,
      },
    ]),
  );

  const allDates = new Set<string>([
    ...usageByDate.keys(),
    ...completedByDate.keys(),
    ...failedByDate.keys(),
  ]);

  return [...allDates].sort().map((date) => {
    const usage = usageByDate.get(date);
    const completedRuns = completedByDate.get(date) ?? usage?.totalRuns ?? 0;
    const failedRuns = failedByDate.get(date) ?? 0;

    return {
      date,
      completedRuns,
      failedRuns,
      totalRuns: completedRuns + failedRuns,
      totalInputTokens: usage?.totalInputTokens ?? 0,
      totalOutputTokens: usage?.totalOutputTokens ?? 0,
      totalCostUsd: usage?.totalCostUsd ?? 0,
    };
  });
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
