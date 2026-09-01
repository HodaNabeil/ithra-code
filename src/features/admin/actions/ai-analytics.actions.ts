'use server';

import {
  getCostSummaryAnalytics,
  getDailyTrendAnalytics,
  getDailyUsageAnalytics,
  getModelBreakdownAnalytics,
  getOverviewAnalytics,
  getUsageByModel,
  getUsageByProvider,
  listAgentRuns,
  normalizeAnalyticsFilters,
  type AnalyticsFiltersInput,
} from '@/ai-platform/observability/dashboard/cost-analytics.service';
import {
  AdminAccessError,
  requireAdminSession,
} from '@/lib/admin/require-admin-session';

function serializeDailyUsage<
  T extends {
    totalInputTokens: bigint;
    totalOutputTokens: bigint;
    totalCostUsd: unknown;
  },
>(rows: T[]) {
  return rows.map((row) => ({
    ...row,
    totalInputTokens: Number(row.totalInputTokens),
    totalOutputTokens: Number(row.totalOutputTokens),
    totalCostUsd: Number(row.totalCostUsd),
  }));
}

async function withAdminAnalytics<T>(
  filters: AnalyticsFiltersInput,
  handler: (
    normalizedFilters: ReturnType<typeof normalizeAnalyticsFilters>,
  ) => Promise<T>,
): Promise<T> {
  await requireAdminSession();
  return handler(normalizeAnalyticsFilters(filters));
}

export async function getAiAnalyticsOverviewAction(
  filters: AnalyticsFiltersInput = {},
) {
  return withAdminAnalytics(filters, getOverviewAnalytics);
}

export async function getAiAnalyticsCostSummaryAction(
  filters: AnalyticsFiltersInput = {},
) {
  return withAdminAnalytics(filters, getCostSummaryAnalytics);
}

export async function getAiAnalyticsRunsAction(
  filters: AnalyticsFiltersInput = {},
) {
  return withAdminAnalytics(filters, listAgentRuns);
}

export async function getAiAnalyticsProvidersAction(
  filters: AnalyticsFiltersInput = {},
) {
  return withAdminAnalytics(filters, getUsageByProvider);
}

export async function getAiAnalyticsModelsAction(
  filters: AnalyticsFiltersInput = {},
) {
  return withAdminAnalytics(filters, getUsageByModel);
}

export async function getAiAnalyticsModelBreakdownAction(
  filters: AnalyticsFiltersInput = {},
) {
  return withAdminAnalytics(filters, getModelBreakdownAnalytics);
}

export async function getAiAnalyticsDailyTrendAction(
  filters: AnalyticsFiltersInput = {},
) {
  return withAdminAnalytics(filters, getDailyTrendAnalytics);
}

export async function getAiAnalyticsDailyUsageAction(
  filters: AnalyticsFiltersInput = {},
) {
  return withAdminAnalytics(filters, async (normalizedFilters) =>
    serializeDailyUsage(await getDailyUsageAnalytics(normalizedFilters)),
  );
}

export async function assertAiAnalyticsAdminAccessAction() {
  try {
    await requireAdminSession();
    return { authorized: true as const };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { authorized: false as const };
    }

    throw error;
  }
}
