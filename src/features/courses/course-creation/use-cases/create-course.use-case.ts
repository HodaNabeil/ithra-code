import { ZodError } from 'zod';
import {
  createCourseSchema,
  type CreateCourseInputDTO,
  type CreateCourseOutputDTO,
} from '../dto/create-course.dto';
import { createCourseDraftEntity } from '../domain/course-draft.entity';
import { CourseCreationError } from '../errors/course-creation.errors';
import { assertCanCreateCourse } from '../policies/create-course.policy';
import {
  courseCreationRepository,
  type CourseCreationRepository,
} from '../repository/create-course.repository';
import { checkCourseCreationRateLimit } from '../lib/rate-limit';
import { invalidateCourseListCache } from '../cache/course-creation.cache';

export type CreateCourseUseCaseInput = {
  input: unknown;
  userId: string;
  userRole: string | undefined;
};

function mapValidationError(error: ZodError): CourseCreationError {
  const message = error.issues.map((issue) => issue.message).join(', ');
  return new CourseCreationError(400, message, 'VALIDATION_ERROR');
}

function toOutputDTO(
  record: Awaited<ReturnType<CourseCreationRepository['create']>>,
): CreateCourseOutputDTO {
  return {
    id: record.id,
    slug: record.slug,
    status: record.status,
    visibility: record.visibility,
    title: record.title,
    price: record.price,
  };
}

/** Creates a minimal draft course shell for the authenticated instructor. */
export async function createCourseUseCase(
  params: CreateCourseUseCaseInput,
  repository: CourseCreationRepository = courseCreationRepository,
): Promise<CreateCourseOutputDTO> {
  const { input, userId, userRole } = params;

  assertCanCreateCourse(userRole);
  await checkCourseCreationRateLimit(userId);

  let parsed: CreateCourseInputDTO;
  try {
    parsed = createCourseSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      throw mapValidationError(error);
    }
    throw error;
  }

  const { slug, pathId, trackId } = parsed;

  if (await repository.isSlugTaken(slug)) {
    throw new CourseCreationError(
      409,
      'A course with this slug already exists',
      'SLUG_TAKEN',
    );
  }

  if (!(await repository.pathExists(pathId))) {
    throw new CourseCreationError(
      400,
      'The specified path does not exist',
      'PATH_NOT_FOUND',
    );
  }

  if (trackId && !(await repository.trackBelongsToPath(trackId, pathId))) {
    throw new CourseCreationError(
      400,
      'The specified track does not belong to the path',
      'TRACK_PATH_MISMATCH',
    );
  }

  const entity = createCourseDraftEntity({
    slug,
    pathId,
    trackId,
    instructorId: userId,
  });

  const created = await repository.create(entity);

  void invalidateCourseListCache();

  return toOutputDTO(created);
}
