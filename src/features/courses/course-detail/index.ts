export { courseDetailCache } from './cache/course-detail.cache';

export type {
  AttachmentApiDTO,
  CourseDetailApiDTO,
  CourseDetailPublicDTO,
  GetCourseDetailResponse,
  LessonApiDTO,
  PrerequisiteApiDTO,
  SectionApiDTO,
  UserCourseSignals,
} from './dto/course-detail.dto';

export {
  COURSE_NOT_FOUND_MESSAGE,
  CourseDetailError,
} from './errors/course-detail.errors';

export { mapCourseDetailEntityToPublicDTO } from './mapper/to-api-dto';
export {
  mapCourseDetailEntityToPageDTO,
  mapEntityToJsonLdFields,
  mapEntityToOutlineSlice,
  mapEntityToRequirementsSlice,
  mapEntityToSeoFields,
  mapPrerequisitesFromDetailEntity,
  mapReviewsFromDetailEntity,
  mapSectionsFromDetailEntity,
} from './mapper/to-page-dto';

export {
  courseDetailRepository,
  type CourseDetailRepository,
} from './repository/course-detail.repository';
export {
  courseDetailApiSelect,
  courseDetailSelect,
  type DB_CourseDetailEntity,
} from './repository/course-detail.select';

export {
  getCourseDetail,
  type CourseDetailUser,
  type GetCourseDetailInput,
} from './use-cases/get-course-detail.use-case';

export {
  loadCourseDetailBySlug,
  loadCourseDetailPage,
} from './use-cases/load-course-detail-page.use-case';
