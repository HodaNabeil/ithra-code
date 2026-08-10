import { z } from 'zod';

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
