export type {
  EnrollmentCourseDTO,
  EnrollmentListItemDTO,
  EnrollmentListPagination,
  EnrollmentListQuery,
  EnrollmentListResult,
  EnrollmentProgressDTO,
  EnrollmentPurchaseDTO,
  EnrollmentReviewDTO,
  ListStudentEnrollmentsInput,
} from './application/dto/enrollment-list.dto';

export {
  EnrollmentError,
  EnrollmentValidationError,
  ENROLLMENTS_FETCHED_MESSAGE,
} from './application/errors/enrollment.errors';

export {
  DEFAULT_ENROLLMENT_STATUSES,
  ENROLLMENTS_DEFAULT_LIMIT,
  ENROLLMENTS_DEFAULT_PAGE,
  ENROLLMENTS_MAX_LIMIT,
  MAX_ENROLLMENTS_PER_STUDENT,
} from './application/constants';

export { EnrollmentEntity } from './domain/enrollment.entity';
export type {
  EnrollmentObject,
  EnrollmentRecord,
} from './domain/enrollment.entity';

export {
  parseEnrollmentListQuery,
  parseEnrollmentListQueryFromSearchParams,
  enrollmentListQueryOpenApiSchema,
} from './api/validation/enrollment-list-query';
export type { EnrollmentListQueryInput } from './api/validation/enrollment-list-query';

export { enrollmentListDataSchema } from './api/openapi';
export { registerEnrollmentsOpenApi } from './api/register-enrollments-openapi';

export { listStudentEnrollments } from './infrastructure/di/enrollments.container';

export {
  ListStudentEnrollmentsUseCase,
  createListStudentEnrollmentsUseCase,
} from './application/use-cases/list-student-enrollments.use-case';
export type { ListStudentEnrollmentsDependencies } from './application/use-cases/list-student-enrollments.use-case';
