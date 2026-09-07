import type { AuthenticatedUser } from './authenticated-user.types';

export type PublishCourseInput = {
  courseIdOrSlug: string;
  user: AuthenticatedUser;
};

export type PublishCourseResult = {
  published: true;
  alreadyPublished: boolean;
  courseId: string;
  courseSlug: string;
  indexingWarning?: string;
};

export type PublishLectureInput = {
  courseIdOrSlug: string;
  lectureId: string;
  user: AuthenticatedUser;
};

export type PublishLectureResult = {
  published: true;
  alreadyPublished: boolean;
  courseId: string;
  courseSlug: string;
  lectureId: string;
  indexingWarning?: string;
};
