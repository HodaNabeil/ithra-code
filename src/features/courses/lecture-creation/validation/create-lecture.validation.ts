import { LectureType } from '@prisma/client';
import { z } from 'zod';

import { LectureCreationError } from '../errors/lecture-creation.errors';

const CUID_REGEX = /^c[a-z0-9]{24}$/;

export const createLectureParamsSchema = z.object({
  sectionId: z.string(),
});

export type CreateLectureParams = z.infer<typeof createLectureParamsSchema>;

export const createLectureBodySchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().nullable().optional().default(null),
    type: z.nativeEnum(LectureType),
  })
  .strict();

export type CreateLectureBodyInput = z.infer<typeof createLectureBodySchema>;

export function invalidSectionIdMessage(value: string): string {
  return `Invalid section ID format: "${value}"`;
}

export function parseCreateLectureParams(params: unknown): CreateLectureParams {
  const parsed = createLectureParamsSchema.parse(params);

  if (!CUID_REGEX.test(parsed.sectionId)) {
    throw new LectureCreationError(
      400,
      invalidSectionIdMessage(parsed.sectionId),
      'INVALID_SECTION_ID',
    );
  }

  return parsed;
}

export function parseCreateLectureBody(body: unknown): CreateLectureBodyInput {
  const result = createLectureBodySchema.safeParse(body);

  if (!result.success) {
    const message = result.error.issues[0]?.message ?? 'Invalid request body';
    throw new LectureCreationError(400, message, 'VALIDATION_ERROR');
  }

  return result.data;
}
