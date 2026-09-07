import { Role } from '@prisma/client';
import { ZodError } from 'zod';

import type {
  GetLectureResponse,
  LectureDetailCourseIdentity,
  LectureDetailEnrollment,
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

function canBypassEnrollment(
  viewer: LectureDetailViewer,
  course: LectureDetailCourseIdentity,
): boolean {
  return (
    viewer.role === Role.ADMIN || viewer.id === course.instructorId
  );
}

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
    lecture.section,
    lectureId,
    viewer,
  );

  const bypassEnrollment = canBypassEnrollment(viewer, courseIdentity);

  let enrollment: LectureDetailEnrollment | null = null;
  let hasRated: boolean;
  let ratingAggregate: Awaited<
    ReturnType<LectureDetailRepository['getCourseRatingAggregate']>
  >;

  if (bypassEnrollment) {
    [hasRated, ratingAggregate] = await Promise.all([
      repository.hasUserReviewedCourse(course.id, viewer.id),
      repository.getCourseRatingAggregate(course.id),
    ]);
  } else {
    [enrollment, hasRated, ratingAggregate] = await Promise.all([
      repository.findValidEnrollment(viewer.id, course.id),
      repository.hasUserReviewedCourse(course.id, viewer.id),
      repository.getCourseRatingAggregate(course.id),
    ]);
  }

  assertLecturePaidAccess(courseIdentity, lecture, viewer, enrollment);

  const hasPurchased = computeHasPurchased(
    courseIdentity,
    viewer,
    enrollment,
  );

  return mapGetLectureResponse({
    lecture,
    course,
    ratingAggregate,
    hasPurchased,
    hasRated,
  });
}
