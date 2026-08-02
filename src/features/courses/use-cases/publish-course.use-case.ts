import { CourseStatus } from '@prisma/client';

import type { CourseKnowledgeIndexerPort } from '@/features/courses/application/ports/course-knowledge-indexer.port';

import {
  PublishCourseError,
  COURSE_NOT_FOUND_MESSAGE,
  LECTURE_NOT_FOUND_MESSAGE,
} from '../errors/publish-course.errors';
import {
  type PublishableCourseRepository,
  type PublishableLectureRepository,
} from '../repositories/publishable-course.repository';
import {
  assertCanArchiveCourse,
  assertCourseOwnership,
} from '../services/course-authorization.service';
import type {
  PublishCourseInput,
  PublishCourseResult,
  PublishLectureInput,
  PublishLectureResult,
} from '../types/publish-course.types';
import {
  scheduleCourseIndexing,
  scheduleLectureIndexing,
} from './schedule-course-indexing';

export type PublishCourseUseCaseDeps = {
  courseRepository: PublishableCourseRepository;
  lectureRepository: PublishableLectureRepository;
  courseKnowledgeIndexer: CourseKnowledgeIndexerPort;
  cacheInvalidator: {
    invalidateAfterCoursePublish(slug: string): Promise<void>;
    invalidateAfterLecturePublish(slug: string): Promise<void>;
  };
};

/** Publishes a course and schedules AI Tutor knowledge indexing asynchronously. */
export async function publishCourseUseCase(
  input: PublishCourseInput,
  deps: PublishCourseUseCaseDeps,
): Promise<PublishCourseResult> {
  const { idOrSlug, user } = input;

  assertCanArchiveCourse(user);

  const existing = await deps.courseRepository.findByIdOrSlug(idOrSlug);
  if (!existing) {
    throw new PublishCourseError(404, COURSE_NOT_FOUND_MESSAGE, 'COURSE_NOT_FOUND');
  }

  assertCourseOwnership(user, existing.instructorId);

  const alreadyPublished = existing.status === CourseStatus.PUBLISHED;
  const course = alreadyPublished
    ? existing
    : await deps.courseRepository.publish(existing.id);

  void deps.cacheInvalidator.invalidateAfterCoursePublish(course.slug);

  const indexingWarning = await scheduleCourseIndexing({
    courseId: course.id,
    courseSlug: course.slug,
    triggeredByUserId: user.id,
    contentVersion: course.updatedAt.toISOString(),
    indexer: deps.courseKnowledgeIndexer,
  });

  return {
    published: true,
    alreadyPublished,
    courseId: course.id,
    courseSlug: course.slug,
    ...(indexingWarning ? { indexingWarning } : {}),
  };
}

/** Publishes a lecture and schedules lecture-scoped AI Tutor indexing asynchronously. */
export async function publishLectureUseCase(
  input: PublishLectureInput,
  deps: PublishCourseUseCaseDeps,
): Promise<PublishLectureResult> {
  const { courseIdOrSlug, lectureId, user } = input;

  assertCanArchiveCourse(user);

  const lecture = await deps.lectureRepository.findById(lectureId);
  if (!lecture) {
    throw new PublishCourseError(404, LECTURE_NOT_FOUND_MESSAGE, 'LECTURE_NOT_FOUND');
  }

  const course = await deps.courseRepository.findByIdOrSlug(courseIdOrSlug);
  if (!course || course.id !== lecture.course.id) {
    throw new PublishCourseError(404, LECTURE_NOT_FOUND_MESSAGE, 'LECTURE_NOT_FOUND');
  }

  assertCourseOwnership(user, lecture.course.instructorId);

  if (lecture.course.status !== CourseStatus.PUBLISHED) {
    throw new PublishCourseError(
      400,
      'يجب نشر الدورة قبل نشر المحاضرات',
      'COURSE_NOT_PUBLISHED',
    );
  }

  const alreadyPublished = lecture.isPublished;
  const publishedLecture = alreadyPublished
    ? lecture
    : await deps.lectureRepository.publish(lectureId);

  void deps.cacheInvalidator.invalidateAfterLecturePublish(lecture.course.slug);

  const indexingWarning = await scheduleLectureIndexing({
    courseId: lecture.course.id,
    courseSlug: lecture.course.slug,
    lectureId: publishedLecture.id,
    triggeredByUserId: user.id,
    contentVersion: publishedLecture.updatedAt.toISOString(),
    indexer: deps.courseKnowledgeIndexer,
  });

  return {
    published: true,
    alreadyPublished,
    courseId: lecture.course.id,
    courseSlug: lecture.course.slug,
    lectureId: publishedLecture.id,
    ...(indexingWarning ? { indexingWarning } : {}),
  };
}
