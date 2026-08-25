import { Badge } from '@/components/ui/badge';
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
import type { ModelBreakdownRow } from '@/ai-platform/observability/dashboard/cost-analytics.service';

type ModelBreakdownTableProps = {
  rows: ModelBreakdownRow[];
};

export function ModelBreakdownTable({ rows }: ModelBreakdownTableProps) {
  return (
    <Card className="py-5">
      <CardHeader className="px-5 sm:px-6">
        <CardTitle>تفصيل النماذج</CardTitle>
        <CardDescription>
          التكلفة، التوكنات، الأخطاء، وزمن الاستجابة لكل نموذج
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto px-3 pb-2 sm:px-5">
        <table className="w-full min-w-180 text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="px-5 py-3.5 text-start font-medium">المزود</th>
              <th className="px-5 py-3.5 text-start font-medium">النموذج</th>
              <th className="px-5 py-3.5 text-start font-medium">الطلبات</th>
              <th className="px-5 py-3.5 text-start font-medium">التوكنات</th>
              <th className="px-5 py-3.5 text-start font-medium">التكلفة</th>
              <th className="px-5 py-3.5 text-start font-medium">معدل الخطأ</th>
              <th className="px-5 py-3.5 text-start font-medium">
                زمن الاستجابة
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-10 text-center text-muted-foreground"
                >
                  لا توجد بيانات للنماذج في هذه الفترة.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={`${row.provider}:${row.model}`}
                  className="border-b border-border/60"
                >
                  <td className="px-5 py-3.5">{row.provider}</td>
                  <td className="px-5 py-3.5 font-medium">{row.model}</td>
                  <td className="px-5 py-3.5">{formatCount(row.totalRuns)}</td>
                  <td className="px-5 py-3.5">
                    {formatCount(row.totalInputTokens + row.totalOutputTokens)}
                  </td>
                  <td className="px-5 py-3.5">{formatUsd(row.totalCostUsd)}</td>
                  <td className="px-5 py-3.5">
                    {formatPercent(row.errorRate)}
                  </td>
                  <td className="px-5 py-3.5">
                    {formatLatency(row.avgLatencyMs)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

type RecentRunsTableProps = {
  runs: Array<{
    id: string;
    agentId: string;
    status: string;
    model: string;
    provider: string;
    actualModel: string | null;
    actualProvider: string | null;
    inputTokens: number | null;
    outputTokens: number | null;
    estimatedCostUsd: number | null;
    latencyMs: number | null;
    tokenUsageEstimated: boolean;
    createdAt: string;
  }>;
};

function statusBadgeVariant(
  status: string,
): 'default' | 'destructive' | 'secondary' {
  if (status === 'failed') {
    return 'destructive';
  }

  if (status === 'running') {
    return 'secondary';
  }

  return 'default';
}

function statusLabel(status: string): string {
  switch (status) {
    case 'completed':
      return 'مكتمل';
    case 'failed':
      return 'فاشل';
    case 'running':
      return 'قيد التشغيل';
    default:
      return status;
  }
}

export function RecentRunsTable({ runs }: RecentRunsTableProps) {
  return (
    <Card className="py-5">
      <CardHeader className="px-5 sm:px-6">
        <CardTitle>أحدث الطلبات</CardTitle>
        <CardDescription>
          آخر 20 تشغيلاً مع حالة التقدير والتكلفة
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto px-3 pb-2 sm:px-5">
        <table className="w-full min-w-240 text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="px-5 py-3.5 text-start font-medium">الوقت</th>
              <th className="px-5 py-3.5 text-start font-medium">الوكيل</th>
              <th className="px-5 py-3.5 text-start font-medium">النموذج</th>
              <th className="px-5 py-3.5 text-start font-medium">التوكنات</th>
              <th className="px-5 py-3.5 text-start font-medium">التكلفة</th>
              <th className="px-5 py-3.5 text-start font-medium">
                زمن الاستجابة
              </th>
              <th className="px-5 py-3.5 text-start font-medium">الحالة</th>
              <th className="px-5 py-3.5 text-start font-medium">التقدير</th>
            </tr>
          </thead>
          <tbody>
            {runs.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-10 text-center text-muted-foreground"
                >
                  لا توجد طلبات في هذه الفترة.
                </td>
              </tr>
            ) : (
              runs.map((run) => {
                const billingModel = run.actualModel ?? run.model;
                const billingProvider = run.actualProvider ?? run.provider;

                return (
                  <tr key={run.id} className="border-b border-border/60">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {new Intl.DateTimeFormat('ar-EG', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(run.createdAt))}
                    </td>
                    <td className="px-5 py-3.5">{run.agentId}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium">{billingModel}</div>
                      <div className="text-xs text-muted-foreground">
                        {billingProvider}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {formatCount(
                        (run.inputTokens ?? 0) + (run.outputTokens ?? 0),
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {run.estimatedCostUsd === null
                        ? '—'
                        : formatUsd(run.estimatedCostUsd)}
                    </td>
                    <td className="px-5 py-3.5">
                      {formatLatency(run.latencyMs)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={statusBadgeVariant(run.status)}>
                        {statusLabel(run.status)}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      {run.tokenUsageEstimated ? (
                        <Badge variant="outline">مُقدَّر</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
