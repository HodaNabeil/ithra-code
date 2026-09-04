import { z } from 'zod';

export const courseOverviewParamsSchema = z.object({
  courseIdOrSlug: z
    .string()
    .trim()
    .min(1, 'Course identifier is required')
    .max(200, 'Course identifier is too long'),
});

export type CourseOverviewParams = z.infer<typeof courseOverviewParamsSchema>;

export function parseCourseOverviewParams(
  params: unknown,
): CourseOverviewParams {
  return courseOverviewParamsSchema.parse(params);
}
