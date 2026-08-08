import { env } from '@/config';

export { parseAnalyticsFiltersFromRequest as parseAnalyticsFilters } from '@/ai-platform/observability/dashboard/analytics-filters';

export function isAiAdminAuthorized(request: Request): boolean {
  const secret = env.AI_ADMIN_API_SECRET;
  if (!secret) {
    return false;
  }

  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}
