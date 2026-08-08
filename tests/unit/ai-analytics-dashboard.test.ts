import { describe, expect, it } from 'vitest';

import { resolveAnalyticsDateRange } from '@/features/admin/lib/ai-analytics-date-range';
import {
  formatLatency,
  formatPercent,
  formatUsd,
} from '@/features/admin/lib/ai-analytics-formatters';

describe('ai-analytics-date-range', () => {
  it('defaults to a 30-day window', () => {
    const range = resolveAnalyticsDateRange({});
    const from = new Date(range.from);
    const to = new Date(range.to);

    expect(range.days).toBe(30);
    expect(to.getTime()).toBeGreaterThan(from.getTime());
  });

  it('respects explicit day presets', () => {
    const range = resolveAnalyticsDateRange({ days: '7' });

    expect(range.days).toBe(7);
  });
});

describe('ai-analytics-formatters', () => {
  it('formats currency, percent, and latency values', () => {
    expect(formatUsd(0.0023)).toContain('$');
    expect(formatPercent(0.125)).toBe('12.5%');
    expect(formatLatency(850)).toBe('850 ms');
    expect(formatLatency(2500)).toBe('2.5 s');
    expect(formatLatency(null)).toBe('—');
  });
});
