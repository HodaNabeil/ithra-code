import { z } from 'zod';

export const indexCourseInputSchema = z.object({
  courseSlug: z.string().trim().min(1, 'معرف الدورة مطلوب'),
});

export type IndexCourseInputDTO = z.infer<typeof indexCourseInputSchema>;

export type IndexCourseResultDTO = {
  courseId: string;
  courseSlug: string;
  chunksIndexed: number;
  sourcesProcessed: number;
  attachmentsSkipped?: number;
  sourcesUnchanged?: number;
  errors?: number;
  indexedAt: string;
};
