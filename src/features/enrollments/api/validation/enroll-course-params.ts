import { z } from 'zod';

export const courseIdOrSlugSchema = z
  .string()
  .trim()
  .min(1, 'معرّف الدورة غير صالح')
  .max(128, 'معرّف الدورة غير صالح');

export type CourseIdOrSlug = z.infer<typeof courseIdOrSlugSchema>;
