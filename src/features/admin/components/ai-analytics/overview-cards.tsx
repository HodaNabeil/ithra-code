import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import {
  formatCount,
  formatLatency,
  formatPercent,
  formatUsd,
} from '@/features/admin/lib/ai-analytics-formatters';
import type { AnalyticsOverview } from '@/ai-platform/observability/dashboard/cost-analytics.service';

type OverviewCardsProps = {
  overview: AnalyticsOverview;
};

const cards = [
  {
    key: 'tokens',
    title: 'إجمالي التوكنات',
    description: 'مدخلات + مخرجات',
    value: (overview: AnalyticsOverview) =>
      formatCount(overview.totalInputTokens + overview.totalOutputTokens),
  },
  {
    key: 'cost',
    title: 'إجمالي التكلفة',
    description: 'تقدير USD للطلبات المكتملة',
    value: (overview: AnalyticsOverview) => formatUsd(overview.totalCostUsd),
  },
  {
    key: 'requests',
    title: 'الطلبات',
    description: 'مكتمل + فاشل + قيد التشغيل',
    value: (overview: AnalyticsOverview) => formatCount(overview.totalRequests),
  },
  {
    key: 'avg-cost',
    title: 'متوسط التكلفة / طلب',
    description: 'للطلبات المكتملة',
    value: (overview: AnalyticsOverview) =>
      formatUsd(overview.avgCostPerRequestUsd),
  },
  {
    key: 'error-rate',
    title: 'معدل الأخطاء',
    description: 'فاشل ÷ (مكتمل + فاشل)',
    value: (overview: AnalyticsOverview) => formatPercent(overview.errorRate),
  },
  {
    key: 'latency',
    title: 'متوسط زمن الاستجابة',
    description: 'للطلبات المكتملة والفاشلة',
    value: (overview: AnalyticsOverview) => formatLatency(overview.avgLatencyMs),
  },
] as const;

export function OverviewCards({ overview }: OverviewCardsProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.key} className="py-5">
          <CardHeader className="px-5 sm:px-6">
            <CardTitle>{card.title}</CardTitle>
            <CardDescription>{card.description}</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-1 sm:px-6">
            <p className="text-2xl font-semibold tracking-tight">
              {card.value(overview)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
