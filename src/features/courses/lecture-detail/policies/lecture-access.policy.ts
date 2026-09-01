import { CourseStatus, Role } from '@prisma/client';

import type {
  LectureDetailCourseIdentity,
  LectureDetailEnrollment,
  LectureDetailViewer,
} from '../dto/lecture-detail.dto';
import {
  LectureDetailError,
  lectureNotFoundMessage,
} from '../errors/lecture-detail.errors';
import { isEnrollmentEligibleForAccess } from '../repository/lecture-detail.repository';

const PURCHASE_REQUIRED_MESSAGE = 'يجب شراء هذه الدورة للوصول إلى محاضراتها';

export function assertLecturePublishedContent(
  course: LectureDetailCourseIdentity,
  lecture: { isPublished: boolean },
  lectureId: string,
  viewer: LectureDetailViewer,
): void {
  if (viewer.role === Role.ADMIN) return;

  if (viewer.role === Role.INSTRUCTOR && viewer.id === course.instructorId) {
    return;
  }

  if (course.status !== CourseStatus.PUBLISHED || !lecture.isPublished) {
    throw new LectureDetailError(
      404,
      lectureNotFoundMessage(lectureId),
      'LECTURE_NOT_FOUND',
    );
  }
}

export function assertLecturePaidAccess(
  course: LectureDetailCourseIdentity,
  lecture: { isFree: boolean },
  viewer: LectureDetailViewer,
  enrollment: LectureDetailEnrollment | null,
): void {
  if (viewer.role === Role.ADMIN) return;

  if (viewer.id === course.instructorId) return;

  if (lecture.isFree) return;

  if (!enrollment || !isEnrollmentEligibleForAccess(enrollment)) {
    throw new LectureDetailError(
      403,
      PURCHASE_REQUIRED_MESSAGE,
      'LECTURE_PURCHASE_REQUIRED',
    );
  }
}

export function computeHasPurchased(
  course: LectureDetailCourseIdentity,
  viewer: LectureDetailViewer,
  enrollment: LectureDetailEnrollment | null,
): boolean {
  if (viewer.role === Role.ADMIN) return true;

  if (viewer.id === course.instructorId) return true;

  if (enrollment && isEnrollmentEligibleForAccess(enrollment)) return true;

  return false;
}
