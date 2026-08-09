import { ZodError } from 'zod';

import type {
  GetLectureResponse,
  LectureDetailViewer,
} from '../dto/lecture-detail.dto';
import {
  courseUnresolvedMessage,
  LectureDetailError,
  lectureNotFoundMessage,
} from '../errors/lecture-detail.errors';
import { mapGetLectureResponse } from '../mapper/lecture-detail.mapper';
import {
  assertLecturePaidAccess,
  assertLecturePublishedContent,
  computeHasPurchased,
} from '../policies/lecture-access.policy';
import {
  lectureDetailRepository,
  type LectureDetailRepository,
} from '../repository/lecture-detail.repository';
import { parseLectureDetailParams } from '../validation/lecture-detail.validation';

export type GetLectureInput = {
  lectureId: string;
  user: LectureDetailViewer;
};

export async function getLecture(
  input: GetLectureInput,
  repository: LectureDetailRepository = lectureDetailRepository,
): Promise<GetLectureResponse> {
  let lectureId: string;

  try {
    ({ lectureId } = parseLectureDetailParams({ lectureId: input.lectureId }));
  } catch (error) {
    if (error instanceof ZodError) {
      throw new LectureDetailError(
        400,
        error.issues[0]?.message ?? 'Invalid request',
      );
    }
    throw error;
  }

  const viewer = input.user;
  const lecture = await repository.findLectureById(lectureId);

  if (!lecture) {
    throw new LectureDetailError(
      404,
      lectureNotFoundMessage(lectureId),
      'LECTURE_NOT_FOUND',
    );
  }

  const course = lecture.section?.course;

  if (!course) {
    throw new LectureDetailError(
      404,
      courseUnresolvedMessage(),
      'COURSE_UNRESOLVED',
    );
  }

  const courseIdentity = {
    id: course.id,
    instructorId: course.instructorId,
    status: course.status,
  };

  assertLecturePublishedContent(
    courseIdentity,
    lecture,
    lectureId,
    viewer,
  );

  const enrollment = await repository.findEnrollment(viewer.id, course.id);

  assertLecturePaidAccess(courseIdentity, lecture, viewer, enrollment);

  const hasPurchased = computeHasPurchased(
    courseIdentity,
    viewer,
    enrollment,
  );
  const hasRated = await repository.hasUserReviewedCourse(course.id, viewer.id);

  return mapGetLectureResponse({
    lecture,
    course,
    hasPurchased,
    hasRated,
  });
}
