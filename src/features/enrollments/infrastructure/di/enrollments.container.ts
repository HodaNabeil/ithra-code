import { prismaEnrollmentCourseRepository } from '../prisma/prisma-course.repository';
import { prismaEnrollmentReadRepository } from '../prisma/prisma-enrollment.repository';
import { prismaEnrollmentOrderRefundReadRepository } from '../prisma/prisma-enrollment-order-refund-read.repository';
import { prismaEnrollmentProgressRepository } from '../prisma/prisma-progress.repository';
import { prismaEnrollmentReviewRepository } from '../prisma/prisma-review.repository';
import { createListStudentEnrollmentsUseCase } from '../../application/use-cases/list-student-enrollments.use-case';

const enrollmentsDependencies = {
  enrollmentRepository: prismaEnrollmentReadRepository,
  courseRepository: prismaEnrollmentCourseRepository,
  reviewRepository: prismaEnrollmentReviewRepository,
  progressRepository: prismaEnrollmentProgressRepository,
  enrollmentOrderRefundReadRepository:
    prismaEnrollmentOrderRefundReadRepository,
} as const;

export const listStudentEnrollments = createListStudentEnrollmentsUseCase(
  enrollmentsDependencies,
);
