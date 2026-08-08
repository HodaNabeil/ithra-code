import { NextResponse } from 'next/server';

import { getOverviewAnalytics } from '@/ai-platform/observability/dashboard/cost-analytics.service';
import {
  isAiAdminAuthorized,
  parseAnalyticsFilters,
} from '@/lib/admin/ai-admin-auth';

export async function GET(request: Request) {
  if (!isAiAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const overview = await getOverviewAnalytics(parseAnalyticsFilters(request));
  return NextResponse.json(overview);
}
