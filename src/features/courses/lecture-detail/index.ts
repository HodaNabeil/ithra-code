export type {
  CourseRatingAggregate,
  GetLectureResponse,
  LectureDetailCourseIdentity,
  LectureDetailDTO,
  LectureDetailEnrollment,
  LectureDetailViewer,
} from './dto/lecture-detail.dto';

export {
  courseUnresolvedMessage,
  LectureDetailError,
  lectureNotFoundMessage,
} from './errors/lecture-detail.errors';

export {
  mapGetLectureResponse,
  mapLectureDetailCourseToApiDTO,
  mapLectureToDTO,
} from './mapper/lecture-detail.mapper';

export {
  assertLecturePaidAccess,
  assertLecturePublishedContent,
  computeHasPurchased,
} from './policies/lecture-access.policy';

export {
  isEnrollmentEligibleForAccess,
  lectureDetailRepository,
  type LectureDetailRepository,
} from './repository/lecture-detail.repository';

export {
  lectureDetailSelect,
  type DB_LectureDetailCourseEntity,
  type DB_LectureDetailEntity,
} from './repository/lecture-detail.select';

export {
  invalidLectureIdMessage,
  lectureDetailParamsSchema,
  parseLectureDetailParams,
  type LectureDetailParams,
} from './validation/lecture-detail.validation';

export {
  getLecture,
  type GetLectureInput,
} from './use-cases/get-lecture.use-case';
