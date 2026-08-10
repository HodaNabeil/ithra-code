import { describe, expect, it } from 'vitest';

import { computeActualIncrement } from '@/features/courses/lecture-progress';

describe('computeActualIncrement', () => {
  it('returns 0 when incrementTime is 0', () => {
    expect(computeActualIncrement(0, 100, 300)).toBe(0);
  });

  it('returns full increment when no video duration', () => {
    expect(computeActualIncrement(30, 0, null)).toBe(30);
    expect(computeActualIncrement(30, 100, 0)).toBe(30);
  });

  it('caps increment at ceil(duration * 1.1) minus current time spent', () => {
    // duration=300, cap=330, current=320, increment=30 => actual=10
    expect(computeActualIncrement(30, 320, 300)).toBe(10);
  });

  it('returns full increment when under cap', () => {
    expect(computeActualIncrement(30, 100, 300)).toBe(30);
  });
});
