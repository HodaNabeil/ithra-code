import { describe, expect, it } from 'vitest';

import {
  computeErrorRate,
  normalizeAnalyticsFilters,
  parseAnalyticsFiltersFromRequest,
} from '@/ai-platform/observability/dashboard/analytics-filters';

describe('analytics-filters', () => {
  it('normalizes ISO date strings into Date objects', () => {
    const filters = normalizeAnalyticsFilters({
      agentId: 'tutor',
      from: '2026-08-01T00:00:00.000Z',
      to: '2026-08-08T00:00:00.000Z',
      tokenUsageEstimated: true,
      status: 'failed',
    });

    expect(filters.agentId).toBe('tutor');
    expect(filters.from).toBeInstanceOf(Date);
    expect(filters.to).toBeInstanceOf(Date);
    expect(filters.tokenUsageEstimated).toBe(true);
    expect(filters.status).toBe('failed');
  });

  it('parses query params from admin API requests', () => {
    const request = new Request(
      'https://example.com/api/admin/ai/overview?agentId=tutor&tokenUsageEstimated=false&status=completed&page=2&limit=25',
    );

    expect(parseAnalyticsFiltersFromRequest(request)).toEqual({
      userId: undefined,
      agentId: 'tutor',
      provider: undefined,
      model: undefined,
      status: 'completed',
      tokenUsageEstimated: false,
      from: undefined,
      to: undefined,
      page: 2,
      limit: 25,
    });
  });

  it('computes error rate from completed and failed runs', () => {
    expect(computeErrorRate(90, 10)).toBe(0.1);
    expect(computeErrorRate(0, 0)).toBe(0);
    expect(computeErrorRate(5, 0)).toBe(0);
  });
});

describe('admin-access.error', () => {
  it('defines an admin access error type', async () => {
    const { AdminAccessError } = await import('@/lib/admin/admin-access.error');
    const error = new AdminAccessError();

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('AdminAccessError');
  });
});
