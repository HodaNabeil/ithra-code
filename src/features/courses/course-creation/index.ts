export type {
  CreateCourseInputDTO,
  CreateCourseOutputDTO,
} from './dto/create-course.dto';
export { createCourseSchema } from './dto/create-course.dto';

export {
  createCourseDraftEntity,
  type CourseDraftEntity,
  type CreateCourseDraftInput,
} from './domain/course-draft.entity';

export { CourseCreationError } from './errors/course-creation.errors';

export { assertCanCreateCourse } from './policies/create-course.policy';

export {
  courseCreationRepository,
  type CourseCreationRepository,
  type CreatedCourseRecord,
} from './repository/create-course.repository';

export { checkCourseCreationRateLimit } from './lib/rate-limit';
export { invalidateCourseListCache } from './cache/course-creation.cache';

export {
  createCourseUseCase,
  type CreateCourseUseCaseInput,
} from './use-cases/create-course.use-case';
