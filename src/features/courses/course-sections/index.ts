export { courseSectionsCache } from './cache/course-sections.cache';

export type {
  AttachmentDTO,
  CourseSectionsCacheScope,
  CourseSectionsEnrollment,
  CourseSectionsIdentity,
  CourseSectionsProgressRecord,
  CourseSectionsViewer,
  GetCourseSectionsResponse,
  LectureDTO,
  LectureProgressDTO,
  SectionStatisticsDTO,
  SectionWithStatsDTO,
  VideoDTO,
} from './dto/course-sections.dto';

export {
  CourseSectionsError,
  courseNotFoundMessage,
} from './errors/course-sections.errors';

export {
  buildProgressMap,
  mapCourseSectionsToDTO,
} from './mapper/course-sections.mapper';

export {
  assertCourseSectionsAccessible,
  isStaffViewer,
  resolveCacheScope,
  resolvePublishedOnly,
} from './policies/course-access.policy';

export {
  courseSectionsRepository,
  isProgressEligibleEnrollment,
  type CourseSectionsRepository,
} from './repository/course-sections.repository';

export {
  buildCourseSectionsSelect,
  courseSectionsIdentitySelect,
  type DB_CourseSectionsEntity,
  type DB_CourseSectionsIdentity,
} from './repository/course-sections.select';

export {
  courseSectionsParamsSchema,
  parseCourseSectionsParams,
  type CourseSectionsParams,
} from './validation/course-sections.validation';

export {
  getCourseSections,
  type GetCourseSectionsInput,
} from './use-cases/get-course-sections.use-case';

export { handleGetCourseSectionsRequest } from './api/get-course-sections.handler';
export { getCourseSectionsClient } from './api/get-course-sections.client';
