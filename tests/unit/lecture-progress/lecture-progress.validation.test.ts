import { describe, expect, it } from 'vitest';

import { updateLectureProgressBodySchema } from '@/features/courses/lecture-progress';

describe('updateLectureProgressBodySchema', () => {
  it('accepts empty body with defaults', () => {
    const result = updateLectureProgressBodySchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isCompleted).toBe(false);
      expect(result.data.incrementTime).toBe(0);
    }
  });

  it('accepts valid incrementTime and isCompleted', () => {
    const result = updateLectureProgressBodySchema.safeParse({
      incrementTime: 30,
      isCompleted: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.incrementTime).toBe(30);
      expect(result.data.isCompleted).toBe(true);
    }
  });

  it('rejects negative incrementTime', () => {
    const result = updateLectureProgressBodySchema.safeParse({
      incrementTime: -5,
    });

    expect(result.success).toBe(false);
  });

  it('rejects unknown fields such as timeSpent', () => {
    const result = updateLectureProgressBodySchema.safeParse({
      timeSpent: 300,
    });

    expect(result.success).toBe(false);
  });
});
