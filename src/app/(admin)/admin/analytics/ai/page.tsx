import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Skeleton } from '@/components/ui/skeleton';
import {
  getAiAnalyticsDailyTrendAction,
  getAiAnalyticsModelBreakdownAction,
  getAiAnalyticsOverviewAction,
  getAiAnalyticsRunsAction,
} from '@/features/admin/actions/ai-analytics.actions';
import { DateRangeFilter } from '@/features/admin/components/ai-analytics/date-range-filter';
import {
  ModelBreakdownTable,
  RecentRunsTable,
} from '@/features/admin/components/ai-analytics/model-breakdown-table';
import { OverviewCards } from '@/features/admin/components/ai-analytics/overview-cards';
import { LazyUsageCharts } from '@/features/admin/components/ai-analytics/lazy-usage-charts';
import { resolveAnalyticsDateRange } from '@/features/admin/lib/ai-analytics-date-range';
import { auth } from '@/lib/auth';

type AiAnalyticsPageProps = {
  searchParams: Promise<{
    days?: string;
    from?: string;
    to?: string;
    agentId?: string;
  }>;
};

export default async function AiAnalyticsPage({
  searchParams,
}: AiAnalyticsPageProps) {
  const session = await auth();

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/');
  }

  const params = await searchParams;
  const range = resolveAnalyticsDateRange(params);
  const filters = {
    from: range.from,
    to: range.to,
    agentId: params.agentId,
  };

  const [overview, trend, breakdown, runs] = await Promise.all([
    getAiAnalyticsOverviewAction(filters),
    getAiAnalyticsDailyTrendAction(filters),
    getAiAnalyticsModelBreakdownAction(filters),
    getAiAnalyticsRunsAction({ ...filters, limit: 20 }),
  ]);

  const serializedRuns = runs.items.map((run) => ({
    id: run.id,
    agentId: run.agentId,
    status: run.status,
    model: run.model,
    provider: run.provider,
    actualModel: run.actualModel,
    actualProvider: run.actualProvider,
    inputTokens: run.inputTokens,
    outputTokens: run.outputTokens,
    estimatedCostUsd:
      run.estimatedCostUsd === null ? null : Number(run.estimatedCostUsd),
    latencyMs: run.latencyMs,
    tokenUsageEstimated: run.tokenUsageEstimated,
    createdAt: run.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 md:px-8 lg:py-10">
      <div className="flex flex-col gap-5 pb-2 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            <Link href="/admin" className="hover:text-foreground">
              لوحة الإدارة
            </Link>
            <span className="mx-2">/</span>
            <span>تحليلات الذكاء الاصطناعي</span>
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            تحليلات استخدام AI
          </h1>
          <p className="text-sm text-muted-foreground">
            نظرة عامة على التكلفة، التوكنات، الأخطاء، وزمن الاستجابة.
          </p>
        </div>

        <Suspense fallback={<Skeleton className="h-9 w-64" />}>
          <DateRangeFilter selectedDays={range.days} />
        </Suspense>
      </div>

      <OverviewCards overview={overview} />
      <LazyUsageCharts trend={trend} />
      <ModelBreakdownTable rows={breakdown} />
      <RecentRunsTable runs={serializedRuns} />
    </div>
  );
}
