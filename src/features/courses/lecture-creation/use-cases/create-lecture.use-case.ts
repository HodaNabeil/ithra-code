import { courseCacheService } from '@/features/courses/services/course-cache.service';
import { assertCourseOwnership } from '@/features/courses/services/course-authorization.service';
import type { AuthenticatedUser } from '@/features/courses/types/authenticated-user.types';

import type {
  CreateLectureBodyDTO,
  CreateLectureResponseDTO,
} from '../dto/create-lecture.dto';
import { LectureCreationError } from '../errors/lecture-creation.errors';
import {
  createLectureRepository,
  type CreateLectureRepository,
} from '../repository/create-lecture.repository';

export type CreateLectureUseCaseInput = {
  sectionId: string;
  body: CreateLectureBodyDTO;
  user: AuthenticatedUser;
};

/** Creates a new lecture inside an existing section with server-enforced defaults. */
export async function createLectureUseCase(
  input: CreateLectureUseCaseInput,
  repository: CreateLectureRepository = createLectureRepository,
): Promise<CreateLectureResponseDTO> {
  const { sectionId, body, user } = input;

  const sectionWithCourse = await repository.findSectionWithCourse(sectionId);

  if (!sectionWithCourse) {
    throw new LectureCreationError(
      404,
      'Section not found',
      'SECTION_NOT_FOUND',
    );
  }

  if (!sectionWithCourse.courseId) {
    throw new LectureCreationError(
      404,
      'Course not found',
      'COURSE_NOT_FOUND',
    );
  }

  assertCourseOwnership(user, sectionWithCourse.instructorId);

  const lecture = await repository.createLecture({
    sectionId,
    title: body.title,
    description: body.description,
    type: body.type,
  });

  void courseCacheService.invalidateCourse(sectionWithCourse.courseSlug);

  return { lecture };
}
