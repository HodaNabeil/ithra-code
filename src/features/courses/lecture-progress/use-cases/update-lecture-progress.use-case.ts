import { ZodError } from 'zod';

import { isProgressEligibleEnrollment } from '@/features/courses/course-sections';
import {
  LectureDetailError,
  lectureNotFoundMessage,
} from '@/features/courses/lecture-detail';
import { parseLectureDetailParams } from '@/features/courses/lecture-detail/validation/lecture-detail.validation';

import type {
  ProgressRecordDTO,
  UpdateLectureProgressBody,
} from '../dto/lecture-progress.dto';
import {
  enrollmentAccessDeniedMessage,
  LectureProgressError,
  progressAlreadyCompletedMessage,
} from '../errors/lecture-progress.errors';
import { mapProgressToDTO } from '../mapper/lecture-progress.mapper';
import {
  lectureProgressRepository,
  type LectureProgressRepository,
} from '../repository/lecture-progress.repository';

export type UpdateLectureProgressInput = {
  lectureId: string;
  userId: string;
} & UpdateLectureProgressBody;

export async function updateLectureProgress(
  input: UpdateLectureProgressInput,
  repository: LectureProgressRepository = lectureProgressRepository,
): Promise<ProgressRecordDTO> {
  let lectureId: string;

  try {
    ({ lectureId } = parseLectureDetailParams({ lectureId: input.lectureId }));
  } catch (error) {
    if (error instanceof ZodError) {
      throw new LectureProgressError(
        400,
        error.issues[0]?.message ?? 'Invalid request',
      );
    }
    if (error instanceof LectureDetailError) {
      throw new LectureProgressError(error.status, error.message, error.code);
    }
    throw error;
  }

  const lecture = await repository.findLectureContext(lectureId);

  if (!lecture) {
    throw new LectureProgressError(
      404,
      lectureNotFoundMessage(lectureId),
      'LECTURE_NOT_FOUND',
    );
  }

  const enrollment = await repository.findEnrollment(
    input.userId,
    lecture.courseId,
  );

  if (!enrollment || !isProgressEligibleEnrollment(enrollment)) {
    throw new LectureProgressError(
      403,
      enrollmentAccessDeniedMessage(),
      'ENROLLMENT_ACCESS_DENIED',
    );
  }

  const existing = await repository.findProgress(enrollment.id, lectureId);

  if (existing?.isCompleted) {
    throw new LectureProgressError(
      409,
      progressAlreadyCompletedMessage(),
      'PROGRESS_ALREADY_COMPLETED',
    );
  }

  const progress = await repository.upsertProgressInTransaction({
    enrollmentId: enrollment.id,
    lectureId,
    courseId: lecture.courseId,
    isCompleted: input.isCompleted,
    incrementTime: input.incrementTime,
    videoDuration: lecture.videoDuration,
  });

  return mapProgressToDTO(progress);
}
