import { AskTutorError, AskTutorErrorCodes } from '../errors/ask-tutor.errors';
import type { EnrolledCourseWithProgressDTO } from '../../domain/ports/CourseContextRepositoryPort';

export function lectureExistsInCourse(
  course: EnrolledCourseWithProgressDTO,
  lectureId: string,
): boolean {
  for (const section of course.sections) {
    if (section.lectures.some((lecture) => lecture.id === lectureId)) {
      return true;
    }
  }

  return false;
}

/**
 * Validates that an optional lectureId belongs to the enrolled course.
 * Must run before thread creation.
 */
export function assertLectureBelongsToCourse(
  lectureId: string | undefined,
  course: EnrolledCourseWithProgressDTO,
): void {
  if (!lectureId) {
    return;
  }

  if (!lectureExistsInCourse(course, lectureId)) {
    throw new AskTutorError(
      400,
      'المحاضرة غير موجودة في هذه الدورة',
      AskTutorErrorCodes.INVALID_LECTURE,
    );
  }
}
