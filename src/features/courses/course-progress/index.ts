export type { CourseProgressDTO } from './dto/course-progress.dto';

export { CourseProgressError } from './errors/course-progress.errors';

export {
  courseProgressRepository,
  type CourseProgressRepository,
  type CourseProgressStats,
} from './repository/course-progress.repository';

export { parseGetCourseProgressParams } from './validation/course-progress.validation';

export { handleGetCourseProgressRequest } from './api/get-course-progress.handler';

export {
  getCourseProgress,
  type GetCourseProgressInput,
} from './use-cases/get-course-progress.use-case';
