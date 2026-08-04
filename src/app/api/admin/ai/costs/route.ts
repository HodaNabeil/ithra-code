import { NextResponse } from 'next/server';

import { getCostSummaryAnalytics } from '@/ai-platform/observability/dashboard/cost-analytics.service';
import {
  isAiAdminAuthorized,
  parseAnalyticsFilters,
} from '@/lib/admin/ai-admin-auth';

export async function GET(request: Request) {
  if (!isAiAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const summary = await getCostSummaryAnalytics(parseAnalyticsFilters(request));
  return NextResponse.json(summary);
}
