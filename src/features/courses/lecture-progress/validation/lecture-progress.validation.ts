import { z } from 'zod';

import { parseCourseSectionsParams } from '@/features/courses/course-sections/validation/course-sections.validation';

export function parseListCourseLectureProgressParams(params: unknown): {
  courseIdOrSlug: string;
} {
  return parseCourseSectionsParams(params);
}

export const updateLectureProgressParamsSchema = z.object({
  courseIdOrSlug: z
    .string()
    .trim()
    .min(1, 'Course identifier is required')
    .max(200, 'Course identifier is too long'),
  lectureId: z.string(),
});

export type UpdateLectureProgressParams = z.infer<
  typeof updateLectureProgressParamsSchema
>;

export function parseUpdateLectureProgressParams(
  params: unknown,
): UpdateLectureProgressParams {
  const parsed = updateLectureProgressParamsSchema.parse(params);
  parseCourseSectionsParams({ courseIdOrSlug: parsed.courseIdOrSlug });
  return parsed;
}

export const updateLectureProgressBodySchema = z
  .object({
    isCompleted: z.boolean().optional().default(false),
    incrementTime: z.number().int().min(0).optional().default(0),
  })
  .strict();

export type UpdateLectureProgressBodyInput = z.infer<
  typeof updateLectureProgressBodySchema
>;

export function parseUpdateLectureProgressBody(
  body: unknown,
): UpdateLectureProgressBodyInput {
  return updateLectureProgressBodySchema.parse(body);
}
