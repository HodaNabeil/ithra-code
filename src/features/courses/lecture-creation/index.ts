export type {
  CreateLectureBodyDTO,
  CreateLectureOutputDTO,
  CreateLectureResponseDTO,
} from './dto/create-lecture.dto';

export { LectureCreationError } from './errors/lecture-creation.errors';

export {
  createLectureRepository,
  type CreateLectureRepository,
  type SectionWithCourse,
} from './repository/create-lecture.repository';

export {
  createLectureBodySchema,
  createLectureParamsSchema,
  invalidSectionIdMessage,
  parseCreateLectureBody,
  parseCreateLectureParams,
  type CreateLectureBodyInput,
  type CreateLectureParams,
} from './validation/create-lecture.validation';

export {
  createLectureUseCase,
  type CreateLectureUseCaseInput,
} from './use-cases/create-lecture.use-case';
