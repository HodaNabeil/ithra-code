import type { AuthenticatedUser } from './authenticated-user.types';

export type ArchiveCourseInput = {
  idOrSlug: string;
  user: AuthenticatedUser;
};

export type ArchiveCourseResult = {
  archived: true;
};
