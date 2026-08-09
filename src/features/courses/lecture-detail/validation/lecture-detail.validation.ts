import { z } from 'zod';

import { LectureDetailError } from '../errors/lecture-detail.errors';

const CUID_REGEX = /^c[a-z0-9]{24}$/;

export const lectureDetailParamsSchema = z.object({
  lectureId: z.string(),
});

export type LectureDetailParams = z.infer<typeof lectureDetailParamsSchema>;

export function invalidLectureIdMessage(value: string): string {
  return `تنسيق المعرف غير صالح: "${value}"`;
}

export function parseLectureDetailParams(params: unknown): LectureDetailParams {
  const parsed = lectureDetailParamsSchema.parse(params);

  if (!CUID_REGEX.test(parsed.lectureId)) {
    throw new LectureDetailError(
      400,
      invalidLectureIdMessage(parsed.lectureId),
      'INVALID_LECTURE_ID',
    );
  }

  return parsed;
}
