import { z } from '@/lib/zod-openapi';
import type { CourseStatus, CourseVisibility } from '@prisma/client';

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createCourseSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(SLUG_REGEX, 'Invalid slug format')
    .openapi({ example: 'my-new-course' }),
  pathId: z
    .string()
    .min(1, 'pathId is required')
    .openapi({ example: 'clpath2k4m000008l5d6e3k1n' }),
  trackId: z
    .string()
    .min(1)
    .optional()
    .openapi({ example: 'cltrack2k4m00008l5d6e3k1n' }),
});

export type CreateCourseInputDTO = z.infer<typeof createCourseSchema>;

export type CreateCourseOutputDTO = {
  id: string;
  slug: string;
  status: CourseStatus;
  visibility: CourseVisibility;
  title: string;
  price: number;
};
