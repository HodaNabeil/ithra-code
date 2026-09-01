import { z } from 'zod';

export const courseSectionsParamsSchema = z.object({
  idOrSlug: z
    .string()
    .trim()
    .min(1, 'Course identifier is required')
    .max(200, 'Course identifier is too long'),
});

export type CourseSectionsParams = z.infer<typeof courseSectionsParamsSchema>;

export function parseCourseSectionsParams(
  params: unknown,
): CourseSectionsParams {
  return courseSectionsParamsSchema.parse(params);
}
