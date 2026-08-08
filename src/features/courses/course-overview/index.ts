export { courseOverviewCache } from './cache/course-overview.cache';

export type {
  CourseOverviewCacheScope,
  CourseOverviewDTO,
  CourseOverviewIdentity,
  CourseOverviewRecord,
  GetCourseOverviewResponse,
} from './dto/course-overview.dto';

export {
  COURSE_NOT_FOUND_MESSAGE,
  CourseOverviewError,
} from './errors/course-overview.errors';

export {
  mapCourseOverviewRecordToDTO,
  mergeIdentityAndAggregates,
} from './mapper/course-overview.mapper';

export {
  assertCourseOverviewVisible,
  isStaffViewer,
  resolveCacheScope,
  type CourseOverviewViewer,
} from './policies/course-visibility.policy';

export {
  courseOverviewRepository,
  type CourseOverviewRepository,
} from './repository/course-overview.repository';

export {
  courseOverviewIdentitySelect,
  type DB_CourseOverviewIdentity,
} from './repository/course-overview.select';

export {
  courseOverviewParamsSchema,
  parseCourseOverviewParams,
  type CourseOverviewParams,
} from './validation/course-overview.validation';

export {
  getCourseOverview,
  type GetCourseOverviewInput,
} from './use-cases/get-course-overview.use-case';
