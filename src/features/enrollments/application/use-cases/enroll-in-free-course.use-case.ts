import type {
  EnrollInFreeCourseInputDTO,
  EnrollInFreeCourseOutputDTO,
} from '../dto/enroll-free-course.dto';
import type { FreeEnrollmentRepository } from '../ports/free-enrollment.repository';
import { prismaFreeEnrollmentRepository } from '../../infrastructure/prisma/prisma-free-enrollment.repository';

export type EnrollInFreeCourseUseCaseDeps = {
  freeEnrollmentRepository?: FreeEnrollmentRepository;
};

/** Creates an ACTIVE enrollment for a published public free course. */
export async function enrollInFreeCourseUseCase(
  input: EnrollInFreeCourseInputDTO,
  deps: EnrollInFreeCourseUseCaseDeps = {},
): Promise<EnrollInFreeCourseOutputDTO> {
  const repository =
    deps.freeEnrollmentRepository ?? prismaFreeEnrollmentRepository;

  return repository.enrollInFreeCourse(
    input.studentId,
    input.courseIdOrSlug,
  );
}
