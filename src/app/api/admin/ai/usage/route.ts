import { NextResponse } from 'next/server';

import { getDailyUsageAnalytics } from '@/ai-platform/observability/dashboard/cost-analytics.service';
import {
  isAiAdminAuthorized,
  parseAnalyticsFilters,
} from '@/lib/admin/ai-admin-auth';

export async function GET(request: Request) {
  if (!isAiAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const usage = await getDailyUsageAnalytics(parseAnalyticsFilters(request));
  return NextResponse.json({
    usage: usage.map((row) => ({
      ...row,
      totalInputTokens: Number(row.totalInputTokens),
      totalOutputTokens: Number(row.totalOutputTokens),
      totalCostUsd: Number(row.totalCostUsd),
    })),
  });
}
