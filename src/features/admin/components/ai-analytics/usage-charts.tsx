'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import {
  formatShortDate,
  formatUsd,
} from '@/features/admin/lib/ai-analytics-formatters';
import type { DailyTrendPoint } from '@/ai-platform/observability/dashboard/cost-analytics.service';

type UsageChartsProps = {
  trend: DailyTrendPoint[];
};

const chartColors = {
  primary: 'var(--chart-primary-stroke)',
  success: 'var(--chart-success-stroke)',
  error: 'var(--chart-error-stroke)',
  grid: 'color-mix(in oklab, var(--foreground) 12%, transparent)',
  muted: 'var(--muted-foreground)',
};

function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; name?: string; color?: string }>;
  label?: string;
  valueFormatter: (value: number) => string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-sm">
      <p className="mb-2 font-medium">{label ? formatShortDate(label) : ''}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">{entry.name}</span>
            <span style={{ color: entry.color }}>
              {valueFormatter(entry.value ?? 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function UsageCharts({ trend }: UsageChartsProps) {
  if (trend.length === 0) {
    return (
      <Card className="py-5">
        <CardHeader className="px-5 sm:px-6">
          <CardTitle>اتجاهات الاستخدام</CardTitle>
          <CardDescription>لا توجد بيانات يومية في الفترة المحددة.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const tokenTrend = trend.map((point) => ({
    ...point,
    totalTokens: point.totalInputTokens + point.totalOutputTokens,
  }));

  return (
    <div className="grid gap-5 sm:gap-6 xl:grid-cols-2">
      <Card className="py-5">
        <CardHeader className="px-5 sm:px-6">
          <CardTitle>التكلفة عبر الزمن</CardTitle>
          <CardDescription>مجموع USD اليومي من ai_usage_daily</CardDescription>
        </CardHeader>
        <CardContent className="h-72 px-3 pb-2 sm:px-5">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 12, right: 20, left: 8, bottom: 8 }}>
              <CartesianGrid stroke={chartColors.grid} vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatShortDate}
                stroke={chartColors.muted}
                tick={{ fill: chartColors.muted, fontSize: 12 }}
              />
              <YAxis
                tickFormatter={(value) => formatUsd(Number(value))}
                stroke={chartColors.muted}
                tick={{ fill: chartColors.muted, fontSize: 12 }}
                width={72}
              />
              <Tooltip
                content={
                  <ChartTooltip valueFormatter={(value) => formatUsd(value)} />
                }
              />
              <Line
                type="monotone"
                dataKey="totalCostUsd"
                name="التكلفة"
                stroke={chartColors.primary}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="py-5">
        <CardHeader className="px-5 sm:px-6">
          <CardTitle>التوكنات عبر الزمن</CardTitle>
          <CardDescription>مدخلات + مخرجات يومياً</CardDescription>
        </CardHeader>
        <CardContent className="h-72 px-3 pb-2 sm:px-5">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={tokenTrend} margin={{ top: 12, right: 20, left: 8, bottom: 8 }}>
              <CartesianGrid stroke={chartColors.grid} vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatShortDate}
                stroke={chartColors.muted}
                tick={{ fill: chartColors.muted, fontSize: 12 }}
              />
              <YAxis
                stroke={chartColors.muted}
                tick={{ fill: chartColors.muted, fontSize: 12 }}
                width={56}
              />
              <Tooltip
                content={
                  <ChartTooltip valueFormatter={(value) => String(Math.round(value))} />
                }
              />
              <Line
                type="monotone"
                dataKey="totalTokens"
                name="التوكنات"
                stroke={chartColors.success}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="py-5 xl:col-span-2">
        <CardHeader className="px-5 sm:px-6">
          <CardTitle>الطلبات والأخطاء</CardTitle>
          <CardDescription>مكتمل مقابل فاشل يومياً</CardDescription>
        </CardHeader>
        <CardContent className="h-72 px-3 pb-2 sm:px-5">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 12, right: 20, left: 8, bottom: 8 }}>
              <CartesianGrid stroke={chartColors.grid} vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatShortDate}
                stroke={chartColors.muted}
                tick={{ fill: chartColors.muted, fontSize: 12 }}
              />
              <YAxis
                stroke={chartColors.muted}
                tick={{ fill: chartColors.muted, fontSize: 12 }}
                width={40}
              />
              <Tooltip
                content={
                  <ChartTooltip valueFormatter={(value) => String(Math.round(value))} />
                }
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="completedRuns"
                name="مكتمل"
                stroke={chartColors.success}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="failedRuns"
                name="فاشل"
                stroke={chartColors.error}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
