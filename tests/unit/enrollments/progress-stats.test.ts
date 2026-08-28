import { describe, expect, it } from 'vitest';

import { computeCompletionPercentage } from '@/features/enrollments/application/lib/progress-stats';

describe('computeCompletionPercentage', () => {
  it('returns 0 when there are zero lectures', () => {
    expect(computeCompletionPercentage(0, 0)).toBe(0);
    expect(computeCompletionPercentage(5, 0)).toBe(0);
  });

  it('rounds (completed / total) * 100 to two decimal places', () => {
    expect(computeCompletionPercentage(5, 12)).toBe(41.67);
  });

  it('never returns NaN or Infinity', () => {
    const value = computeCompletionPercentage(1, 0);
    expect(Number.isFinite(value)).toBe(true);
    expect(Number.isNaN(value)).toBe(false);
  });
});
