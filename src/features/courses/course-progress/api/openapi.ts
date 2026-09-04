import { z } from '@/lib/zod-openapi';

export const courseProgressSchema = z.object({
  totalLectures: z.number().int().openapi({
    example: 10,
    description:
      'Number of published lectures in the course that count toward progress',
  }),
  completedLectures: z.number().int().openapi({
    example: 5,
    description:
      'Number of published lectures marked complete for the authenticated user',
  }),
  completionPercentage: z.number().openapi({
    example: 50,
    description:
      'Percentage of published lectures completed (0 when totalLectures is 0)',
  }),
  totalTimeSpent: z.number().int().openapi({
    example: 3600,
    description:
      'Sum of timeSpent in seconds across published lecture progress records',
  }),
  lastAccessedAt: z.string().datetime().nullable().openapi({
    example: '2026-06-01T10:00:00.000Z',
    description:
      'Latest lastAccessedAt across progress records, or null when none exist',
  }),
});
