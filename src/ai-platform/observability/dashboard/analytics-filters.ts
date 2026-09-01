export type AnalyticsFilters = {
  userId?: string;
  agentId?: string;
  provider?: string;
  model?: string;
  status?: 'running' | 'completed' | 'failed';
  tokenUsageEstimated?: boolean;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
};

export type AnalyticsFiltersInput = {
  userId?: string;
  agentId?: string;
  provider?: string;
  model?: string;
  status?: 'running' | 'completed' | 'failed';
  tokenUsageEstimated?: boolean;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

export function normalizeAnalyticsFilters(
  input: AnalyticsFiltersInput = {},
): AnalyticsFilters {
  return {
    userId: input.userId,
    agentId: input.agentId,
    provider: input.provider,
    model: input.model,
    status: input.status,
    tokenUsageEstimated: input.tokenUsageEstimated,
    from: input.from ? new Date(input.from) : undefined,
    to: input.to ? new Date(input.to) : undefined,
    page: input.page,
    limit: input.limit,
  };
}

export function computeErrorRate(
  completedRuns: number,
  failedRuns: number,
): number {
  const terminalRuns = completedRuns + failedRuns;
  if (terminalRuns <= 0) {
    return 0;
  }

  return failedRuns / terminalRuns;
}

export function parseAnalyticsFiltersFromRequest(
  request: Request,
): AnalyticsFilters {
  const url = new URL(request.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const tokenUsageEstimated = url.searchParams.get('tokenUsageEstimated');
  const status = url.searchParams.get('status');

  return normalizeAnalyticsFilters({
    userId: url.searchParams.get('userId') ?? undefined,
    agentId:
      url.searchParams.get('agentId') ??
      url.searchParams.get('agent') ??
      undefined,
    provider: url.searchParams.get('provider') ?? undefined,
    model: url.searchParams.get('model') ?? undefined,
    status:
      status === 'running' || status === 'completed' || status === 'failed'
        ? status
        : undefined,
    tokenUsageEstimated:
      tokenUsageEstimated === 'true'
        ? true
        : tokenUsageEstimated === 'false'
          ? false
          : undefined,
    from: from ?? undefined,
    to: to ?? undefined,
    page: url.searchParams.get('page')
      ? Number(url.searchParams.get('page'))
      : undefined,
    limit: url.searchParams.get('limit')
      ? Number(url.searchParams.get('limit'))
      : undefined,
  });
}
