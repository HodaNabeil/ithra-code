import {
  DEFAULT_ENROLLMENT_STATUSES,
  MAX_ENROLLMENTS_PER_STUDENT,
} from '../constants';
import type {
  EnrollmentListItemDTO,
  EnrollmentListResult,
  ListStudentEnrollmentsInput,
} from '../dto/enrollment-list.dto';
import {
  filterEnrollmentsByTitle,
  paginateItems,
  sortEnrollmentRows,
} from '../lib/enrollment-list-assembly';
import { ZERO_ENROLLMENT_PROGRESS } from '../lib/progress-stats';
import type { EnrollmentCourseRepository } from '../ports/course.repository';
import type { EnrollmentReadRepository } from '../ports/enrollment.repository';
import type { EnrollmentOrderRefundReadRepository } from '../ports/enrollment-order-refund-read.repository';
import type { EnrollmentProgressRepository } from '../ports/progress.repository';
import type { EnrollmentReviewRepository } from '../ports/review.repository';
import { EnrollmentEntity } from '../../domain/enrollment.entity';

export type ListStudentEnrollmentsDependencies = {
  enrollmentRepository: EnrollmentReadRepository;
  courseRepository: EnrollmentCourseRepository;
  reviewRepository: EnrollmentReviewRepository;
  progressRepository: EnrollmentProgressRepository;
  enrollmentOrderRefundReadRepository: EnrollmentOrderRefundReadRepository;
};

function emptyResult(page: number, limit: number): EnrollmentListResult {
  return {
    courses: [],
    pagination: {
      currentPage: page,
      totalPages: 0,
      totalItems: 0,
      itemsPerPage: limit,
    },
  };
}

export class ListStudentEnrollmentsUseCase {
  constructor(private readonly deps: ListStudentEnrollmentsDependencies) {}

  async execute(
    input: ListStudentEnrollmentsInput,
  ): Promise<EnrollmentListResult> {
    const statuses = input.query.status
      ? [input.query.status]
      : [...DEFAULT_ENROLLMENT_STATUSES];

    const enrollments = await this.deps.enrollmentRepository.findByStudentId({
      studentId: input.studentId,
      statuses,
      take: MAX_ENROLLMENTS_PER_STUDENT,
    });

    if (enrollments.length === 0) {
      return emptyResult(input.query.page, input.query.limit);
    }

    const courseIds = [...new Set(enrollments.map((row) => row.courseId))];

    const [courses, reviews, progressByEnrollmentId] = await Promise.all([
      this.deps.courseRepository.findByIds(courseIds),
      this.deps.reviewRepository.findByUserAndCourseIds(
        input.studentId,
        courseIds,
      ),
      this.deps.progressRepository.findStatsByEnrollmentIds(
        enrollments.map((enrollment) => ({
          enrollmentId: enrollment.id,
          courseId: enrollment.courseId,
        })),
      ),
    ]);

    const courseById = new Map(courses.map((course) => [course.id, course]));
    const reviewByCourseId = new Map(
      reviews.map((review) => [review.courseId, review]),
    );

    const assembled = enrollments.flatMap((enrollment) => {
      const course = courseById.get(enrollment.courseId);
      if (!course) {
        return [];
      }

      return [
        {
          enrollment,
          course,
          review: reviewByCourseId.get(enrollment.courseId) ?? null,
          progress:
            progressByEnrollmentId.get(enrollment.id) ??
            ZERO_ENROLLMENT_PROGRESS,
        },
      ];
    });

    const filtered = filterEnrollmentsByTitle(assembled, input.query.search);
    const sorted = sortEnrollmentRows(filtered, input.query);
    const page = paginateItems(sorted, input.query.page, input.query.limit);

    const pageCourseIds = page.items.map((row) => row.course.id);
    const purchases =
      pageCourseIds.length === 0
        ? new Map()
        : await this.deps.enrollmentOrderRefundReadRepository.findLatestByUserAndCourseIds(
            input.studentId,
            pageCourseIds,
          );

    const coursesPage: EnrollmentListItemDTO[] = page.items.map((row) => ({
      enrollment: EnrollmentEntity.fromPersistence(row.enrollment).toObject(),
      course: row.course,
      review: row.review,
      progress: row.progress,
      purchase: purchases.get(row.course.id) ?? null,
    }));

    return {
      courses: coursesPage,
      pagination: {
        currentPage: input.query.page,
        totalPages: page.totalPages,
        totalItems: page.totalItems,
        itemsPerPage: input.query.limit,
      },
    };
  }
}

export function createListStudentEnrollmentsUseCase(
  deps: ListStudentEnrollmentsDependencies,
): (input: ListStudentEnrollmentsInput) => Promise<EnrollmentListResult> {
  const useCase = new ListStudentEnrollmentsUseCase(deps);
  return (input) => useCase.execute(input);
}
