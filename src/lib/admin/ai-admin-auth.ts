import { env } from '@/config';

export function isAiAdminAuthorized(request: Request): boolean {
  const secret = env.AI_ADMIN_API_SECRET;
  if (!secret) {
    return false;
  }

  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

export function parseAnalyticsFilters(request: Request) {
  const url = new URL(request.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  return {
    userId: url.searchParams.get('userId') ?? undefined,
    agentId: url.searchParams.get('agentId') ?? url.searchParams.get('agent') ?? undefined,
    provider: url.searchParams.get('provider') ?? undefined,
    model: url.searchParams.get('model') ?? undefined,
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
    page: url.searchParams.get('page')
      ? Number(url.searchParams.get('page'))
      : undefined,
    limit: url.searchParams.get('limit')
      ? Number(url.searchParams.get('limit'))
      : undefined,
  };
}
