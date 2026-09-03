import { z } from '@/lib/zod-openapi';

export const updateLectureProgressBodyOpenApiSchema = z
  .object({
    isCompleted: z.boolean().optional().openapi({
      example: false,
      description:
        'Mark the lecture as completed. When true, sets completedAt to the current timestamp. Defaults to false.',
    }),
    incrementTime: z.number().int().min(0).optional().openapi({
      example: 30,
      description:
        'Seconds to add to the stored timeSpent value (additive, not absolute). Must be a non-negative integer. Defaults to 0.',
    }),
  })
  .strict()
  .openapi({
    description:
      'All fields are optional. An empty body `{}` is valid and updates lastAccessedAt only.',
  });

export const progressRecordSchema = z.object({
  id: z.string().openapi({
    example: 'clprogress2k4m00008l5d6e3k1n',
    description: 'Progress record CUID',
  }),
  enrollmentId: z.string().openapi({
    example: 'clenroll2k4m00008l5d6e3k1n',
    description: 'Enrollment CUID for the authenticated student',
  }),
  lectureId: z.string().openapi({
    example: 'cllecture2k4m00008l5d6e3k1n',
    description: 'Lecture CUID',
  }),
  isCompleted: z.boolean().openapi({ example: false }),
  completedAt: z.string().datetime().nullable().openapi({
    example: null,
    description: 'ISO timestamp when the lecture was marked complete',
  }),
  lastAccessedAt: z.string().datetime().openapi({
    example: '2026-06-01T10:00:00.000Z',
    description: 'Updated on every valid progress request',
  }),
  timeSpent: z.number().int().openapi({
    example: 330,
    description:
      'Accumulated watch time in seconds; capped at ceil(videoDuration * 1.1) when video duration is known',
  }),
  createdAt: z.string().datetime().openapi({
    example: '2026-06-01T09:00:00.000Z',
  }),
  updatedAt: z.string().datetime().openapi({
    example: '2026-06-01T10:00:00.000Z',
  }),
});

export const updateLectureProgressDataSchema = z.object({
  progress: progressRecordSchema,
});

export const getLectureProgressDataSchema = z.object({
  progress: progressRecordSchema.nullable().openapi({
    description:
      'Progress record for the authenticated user’s enrollment, or null when the user has not started tracking this lecture yet.',
  }),
});
