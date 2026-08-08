'use client';

import dynamic from 'next/dynamic';

import { Skeleton } from '@/components/ui/skeleton';
import type { DailyTrendPoint } from '@/ai-platform/observability/dashboard/cost-analytics.service';

const UsageCharts = dynamic(
  () =>
    import('./usage-charts').then((module) => ({
      default: module.UsageCharts,
    })),
  {
    loading: () => <Skeleton className="h-72 w-full rounded-xl" />,
  },
);

type LazyUsageChartsProps = {
  trend: DailyTrendPoint[];
};

export function LazyUsageCharts({ trend }: LazyUsageChartsProps) {
  return <UsageCharts trend={trend} />;
}
