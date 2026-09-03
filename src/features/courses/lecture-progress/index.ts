export type {
  ProgressRecordDTO,
  UpdateLectureProgressBody,
  UpdateLectureProgressResponse,
} from './dto/lecture-progress.dto';

export {
  enrollmentAccessDeniedMessage,
  LectureProgressError,
  progressAlreadyCompletedMessage,
} from './errors/lecture-progress.errors';

export { computeActualIncrement } from './lib/compute-actual-increment';

export { mapProgressToDTO } from './mapper/lecture-progress.mapper';

export {
  lectureProgressRepository,
  type LectureProgressEnrollment,
  type LectureProgressRecord,
  type LectureProgressRepository,
  type LectureContext,
  type UpsertProgressInput,
} from './repository/lecture-progress.repository';

export {
  parseUpdateLectureProgressBody,
  parseUpdateLectureProgressParams,
  updateLectureProgressBodySchema,
  updateLectureProgressParamsSchema,
  type UpdateLectureProgressBodyInput,
  type UpdateLectureProgressParams,
} from './validation/lecture-progress.validation';

export { handleUpdateLectureProgressRequest } from './api/update-lecture-progress.handler';

export {
  updateLectureProgress,
  type UpdateLectureProgressInput,
} from './use-cases/update-lecture-progress.use-case';
