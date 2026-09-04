import type { AuthenticatedUser } from './authenticated-user.types';

export type ArchiveCourseInput = {
  courseIdOrSlug: string;
  user: AuthenticatedUser;
};

export type ArchiveCourseResult = {
  archived: true;
};
