import { EnrollmentStatus } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { EnrollmentCourseDTO } from '@/features/enrollments/application/dto/enrollment-list.dto';
import type { EnrollmentListQuery } from '@/features/enrollments/application/dto/enrollment-list.dto';
import type { EnrollmentCourseRepository } from '@/features/enrollments/application/ports/course.repository';
import type { EnrollmentReadRepository } from '@/features/enrollments/application/ports/enrollment.repository';
import type { EnrollmentOrderRefundReadRepository } from '@/features/enrollments/application/ports/enrollment-order-refund-read.repository';
import type { EnrollmentProgressRepository } from '@/features/enrollments/application/ports/progress.repository';
import type { EnrollmentReviewRepository } from '@/features/enrollments/application/ports/review.repository';
import { ListStudentEnrollmentsUseCase } from '@/features/enrollments/application/use-cases/list-student-enrollments.use-case';
import type { EnrollmentRecord } from '@/features/enrollments/domain/enrollment.entity';
import { MAX_ENROLLMENTS_PER_STUDENT } from '@/features/enrollments/application/constants';

const studentId = 'student-1';
const otherStudentId = 'student-2';
const baseDate = new Date('2026-02-01T10:00:00.000Z');

function createCourse(
  overrides: Partial<EnrollmentCourseDTO> & { id: string; title: string },
): EnrollmentCourseDTO {
  return {
    description: 'Course description',
    shortDescription: 'Short',
    slug: overrides.title.toLowerCase().replace(/\s+/g, '-'),
    thumbnailUrl: 'https://example.com/thumb.jpg',
    previewVideo: null,
    instructorId: 'instructor-1',
    price: 99,
    compareAtPrice: null,
    currency: 'EGP',
    level: 'BEGINNER',
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    isFeatured: false,
    hours: 10,
    requirements: [],
    objectives: [],
    targetAudience: [],
    tags: [],
    prerequisiteIds: [],
    prerequisites: [],
    firstLectureId: undefined,
    lecturesCount: 0,
    sections: [],
    metaTitle: null,
    metaDescription: null,
    certificateEnabled: true,
    maxStudents: null,
    pathId: 'path-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    publishedAt: '2026-01-15T00:00:00.000Z',
    ...overrides,
  };
}

function createEnrollment(
  overrides: Partial<EnrollmentRecord> & { id: string; courseId: string },
): EnrollmentRecord {
  return {
    studentId,
    status: EnrollmentStatus.ACTIVE,
    enrolledAt: baseDate,
    completedAt: null,
    createdAt: baseDate,
    updatedAt: baseDate,
    ...overrides,
  };
}

const defaultQuery: EnrollmentListQuery = {
  page: 1,
  limit: 10,
  sortBy: 'enrolledAt',
  sortOrder: 'desc',
};

describe('ListStudentEnrollmentsUseCase', () => {
  const enrollmentRepository: EnrollmentReadRepository = {
    findByStudentId: vi.fn(),
  };
  const courseRepository: EnrollmentCourseRepository = {
    findByIds: vi.fn(),
  };
  const reviewRepository: EnrollmentReviewRepository = {
    findByUserAndCourseIds: vi.fn(),
  };
  const progressRepository: EnrollmentProgressRepository = {
    findStatsByEnrollmentIds: vi.fn(),
  };
  const enrollmentOrderRefundReadRepository: EnrollmentOrderRefundReadRepository =
    {
      findLatestByUserAndCourseIds: vi.fn(),
    };

  const useCase = new ListStudentEnrollmentsUseCase({
    enrollmentRepository,
    courseRepository,
    reviewRepository,
    progressRepository,
    enrollmentOrderRefundReadRepository,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(enrollmentRepository.findByStudentId).mockResolvedValue([]);
    vi.mocked(courseRepository.findByIds).mockResolvedValue([]);
    vi.mocked(reviewRepository.findByUserAndCourseIds).mockResolvedValue([]);
    vi.mocked(progressRepository.findStatsByEnrollmentIds).mockResolvedValue(
      new Map(),
    );
    vi.mocked(
      enrollmentOrderRefundReadRepository.findLatestByUserAndCourseIds,
    ).mockResolvedValue(new Map());
  });

  it('returns an empty envelope when the student has no enrollments', async () => {
    const result = await useCase.execute({ studentId, query: defaultQuery });

    expect(result).toEqual({
      courses: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: 10,
      },
    });
    expect(courseRepository.findByIds).not.toHaveBeenCalled();
    expect(
      enrollmentOrderRefundReadRepository.findLatestByUserAndCourseIds,
    ).not.toHaveBeenCalled();
  });

  it('requests only the authenticated student enrollments with a safety cap', async () => {
    await useCase.execute({ studentId, query: defaultQuery });

    expect(enrollmentRepository.findByStudentId).toHaveBeenCalledWith({
      studentId,
      statuses: [EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED],
      take: MAX_ENROLLMENTS_PER_STUDENT,
    });
    expect(enrollmentRepository.findByStudentId).not.toHaveBeenCalledWith(
      expect.objectContaining({ studentId: otherStudentId }),
    );
  });

  it('returns ACTIVE and COMPLETED enrollments by default', async () => {
    const active = createEnrollment({ id: 'enr-1', courseId: 'course-1' });
    const completed = createEnrollment({
      id: 'enr-2',
      courseId: 'course-2',
      status: EnrollmentStatus.COMPLETED,
      enrolledAt: new Date('2026-01-01T10:00:00.000Z'),
    });

    vi.mocked(enrollmentRepository.findByStudentId).mockResolvedValue([
      active,
      completed,
    ]);
    vi.mocked(courseRepository.findByIds).mockResolvedValue([
      createCourse({ id: 'course-1', title: 'React' }),
      createCourse({ id: 'course-2', title: 'Node' }),
    ]);

    const result = await useCase.execute({ studentId, query: defaultQuery });

    expect(result.courses).toHaveLength(2);
    expect(result.courses.map((row) => row.enrollment.status)).toEqual([
      EnrollmentStatus.ACTIVE,
      EnrollmentStatus.COMPLETED,
    ]);
  });

  it('filters by ACTIVE when status is provided', async () => {
    await useCase.execute({
      studentId,
      query: { ...defaultQuery, status: EnrollmentStatus.ACTIVE },
    });

    expect(enrollmentRepository.findByStudentId).toHaveBeenCalledWith({
      studentId,
      statuses: [EnrollmentStatus.ACTIVE],
      take: MAX_ENROLLMENTS_PER_STUDENT,
    });
  });

  it('skips enrollments whose course no longer exists', async () => {
    vi.mocked(enrollmentRepository.findByStudentId).mockResolvedValue([
      createEnrollment({ id: 'enr-1', courseId: 'missing' }),
      createEnrollment({ id: 'enr-2', courseId: 'course-2' }),
    ]);
    vi.mocked(courseRepository.findByIds).mockResolvedValue([
      createCourse({ id: 'course-2', title: 'JavaScript' }),
    ]);

    const result = await useCase.execute({ studentId, query: defaultQuery });

    expect(result.courses).toHaveLength(1);
    expect(result.courses[0]?.course.id).toBe('course-2');
    expect(result.pagination.totalItems).toBe(1);
  });

  it('attaches the user review when one exists', async () => {
    vi.mocked(enrollmentRepository.findByStudentId).mockResolvedValue([
      createEnrollment({ id: 'enr-1', courseId: 'course-1' }),
    ]);
    vi.mocked(courseRepository.findByIds).mockResolvedValue([
      createCourse({ id: 'course-1', title: 'React' }),
    ]);
    vi.mocked(reviewRepository.findByUserAndCourseIds).mockResolvedValue([
      {
        id: 'review-1',
        courseId: 'course-1',
        userId: studentId,
        rating: 5,
        comment: 'Great',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
      },
    ]);

    const result = await useCase.execute({ studentId, query: defaultQuery });

    expect(result.courses[0]?.review).toMatchObject({
      id: 'review-1',
      rating: 5,
    });
  });

  it('returns review null when the user has not reviewed the course', async () => {
    vi.mocked(enrollmentRepository.findByStudentId).mockResolvedValue([
      createEnrollment({ id: 'enr-1', courseId: 'course-1' }),
    ]);
    vi.mocked(courseRepository.findByIds).mockResolvedValue([
      createCourse({ id: 'course-1', title: 'React' }),
    ]);

    const result = await useCase.execute({ studentId, query: defaultQuery });

    expect(result.courses[0]?.review).toBeNull();
  });

  it('returns assembled progress statistics', async () => {
    vi.mocked(enrollmentRepository.findByStudentId).mockResolvedValue([
      createEnrollment({ id: 'enr-1', courseId: 'course-1' }),
    ]);
    vi.mocked(courseRepository.findByIds).mockResolvedValue([
      createCourse({ id: 'course-1', title: 'React' }),
    ]);
    vi.mocked(progressRepository.findStatsByEnrollmentIds).mockResolvedValue(
      new Map([
        [
          'enr-1',
          {
            totalLectures: 12,
            completedLectures: 5,
            totalTimeSpent: 3600,
            completionPercentage: 41.67,
          },
        ],
      ]),
    );

    const result = await useCase.execute({ studentId, query: defaultQuery });

    expect(result.courses[0]?.progress).toEqual({
      totalLectures: 12,
      completedLectures: 5,
      totalTimeSpent: 3600,
      completionPercentage: 41.67,
    });
  });

  it('defaults progress to zeros when no stats exist', async () => {
    vi.mocked(enrollmentRepository.findByStudentId).mockResolvedValue([
      createEnrollment({ id: 'enr-1', courseId: 'course-1' }),
    ]);
    vi.mocked(courseRepository.findByIds).mockResolvedValue([
      createCourse({ id: 'course-1', title: 'React' }),
    ]);

    const result = await useCase.execute({ studentId, query: defaultQuery });

    expect(result.courses[0]?.progress).toEqual({
      totalLectures: 0,
      completedLectures: 0,
      totalTimeSpent: 0,
      completionPercentage: 0,
    });
  });

  it('attaches a purchase snapshot for the current page', async () => {
    vi.mocked(enrollmentRepository.findByStudentId).mockResolvedValue([
      createEnrollment({ id: 'enr-1', courseId: 'course-1' }),
    ]);
    vi.mocked(courseRepository.findByIds).mockResolvedValue([
      createCourse({ id: 'course-1', title: 'React' }),
    ]);
    vi.mocked(
      enrollmentOrderRefundReadRepository.findLatestByUserAndCourseIds,
    ).mockResolvedValue(
      new Map([
        [
          'course-1',
          {
            orderItemId: 'item-1',
            status: 'ACTIVE',
            refundStatus: null,
            refundedAt: null,
          },
        ],
      ]),
    );

    const result = await useCase.execute({ studentId, query: defaultQuery });

    expect(result.courses[0]?.purchase).toEqual({
      orderItemId: 'item-1',
      status: 'ACTIVE',
      refundStatus: null,
      refundedAt: null,
    });
  });

  it('returns purchase null for complimentary enrollments', async () => {
    vi.mocked(enrollmentRepository.findByStudentId).mockResolvedValue([
      createEnrollment({ id: 'enr-1', courseId: 'course-1' }),
    ]);
    vi.mocked(courseRepository.findByIds).mockResolvedValue([
      createCourse({ id: 'course-1', title: 'React' }),
    ]);

    const result = await useCase.execute({ studentId, query: defaultQuery });

    expect(result.courses[0]?.purchase).toBeNull();
  });

  it('filters by case-insensitive course title search', async () => {
    vi.mocked(enrollmentRepository.findByStudentId).mockResolvedValue([
      createEnrollment({ id: 'enr-1', courseId: 'course-1' }),
      createEnrollment({ id: 'enr-2', courseId: 'course-2' }),
    ]);
    vi.mocked(courseRepository.findByIds).mockResolvedValue([
      createCourse({ id: 'course-1', title: 'JavaScript Basics' }),
      createCourse({ id: 'course-2', title: 'Python' }),
    ]);

    const result = await useCase.execute({
      studentId,
      query: { ...defaultQuery, search: 'javascript' },
    });

    expect(result.courses).toHaveLength(1);
    expect(result.courses[0]?.course.title).toBe('JavaScript Basics');
    expect(result.pagination.totalItems).toBe(1);
  });

  it('sorts by title ascending', async () => {
    vi.mocked(enrollmentRepository.findByStudentId).mockResolvedValue([
      createEnrollment({ id: 'enr-1', courseId: 'course-1' }),
      createEnrollment({ id: 'enr-2', courseId: 'course-2' }),
    ]);
    vi.mocked(courseRepository.findByIds).mockResolvedValue([
      createCourse({ id: 'course-1', title: 'React' }),
      createCourse({ id: 'course-2', title: 'Angular' }),
    ]);

    const result = await useCase.execute({
      studentId,
      query: { ...defaultQuery, sortBy: 'title', sortOrder: 'asc' },
    });

    expect(result.courses.map((row) => row.course.title)).toEqual([
      'Angular',
      'React',
    ]);
  });

  it('sorts by enrolledAt descending by default', async () => {
    vi.mocked(enrollmentRepository.findByStudentId).mockResolvedValue([
      createEnrollment({
        id: 'enr-old',
        courseId: 'course-old',
        enrolledAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
      createEnrollment({
        id: 'enr-new',
        courseId: 'course-new',
        enrolledAt: new Date('2026-03-01T00:00:00.000Z'),
      }),
    ]);
    vi.mocked(courseRepository.findByIds).mockResolvedValue([
      createCourse({ id: 'course-old', title: 'Old' }),
      createCourse({ id: 'course-new', title: 'New' }),
    ]);

    const result = await useCase.execute({ studentId, query: defaultQuery });

    expect(result.courses.map((row) => row.course.id)).toEqual([
      'course-new',
      'course-old',
    ]);
  });

  it('paginates after search and sort', async () => {
    vi.mocked(enrollmentRepository.findByStudentId).mockResolvedValue([
      createEnrollment({
        id: 'enr-1',
        courseId: 'course-1',
        enrolledAt: new Date('2026-03-01T00:00:00.000Z'),
      }),
      createEnrollment({
        id: 'enr-2',
        courseId: 'course-2',
        enrolledAt: new Date('2026-02-01T00:00:00.000Z'),
      }),
      createEnrollment({
        id: 'enr-3',
        courseId: 'course-3',
        enrolledAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    ]);
    vi.mocked(courseRepository.findByIds).mockResolvedValue([
      createCourse({ id: 'course-1', title: 'A' }),
      createCourse({ id: 'course-2', title: 'B' }),
      createCourse({ id: 'course-3', title: 'C' }),
    ]);

    const result = await useCase.execute({
      studentId,
      query: { ...defaultQuery, page: 2, limit: 2 },
    });

    expect(result.courses).toHaveLength(1);
    expect(result.courses[0]?.course.id).toBe('course-3');
    expect(result.pagination).toEqual({
      currentPage: 2,
      totalPages: 2,
      totalItems: 3,
      itemsPerPage: 2,
    });
    expect(
      enrollmentOrderRefundReadRepository.findLatestByUserAndCourseIds,
    ).toHaveBeenCalledWith(studentId, ['course-3']);
  });

  it('omits rating fields from the course payload', async () => {
    vi.mocked(enrollmentRepository.findByStudentId).mockResolvedValue([
      createEnrollment({ id: 'enr-1', courseId: 'course-1' }),
    ]);
    vi.mocked(courseRepository.findByIds).mockResolvedValue([
      createCourse({ id: 'course-1', title: 'React' }),
    ]);

    const result = await useCase.execute({ studentId, query: defaultQuery });
    const course = result.courses[0]?.course as Record<string, unknown>;

    expect(course).not.toHaveProperty('rating');
    expect(course).not.toHaveProperty('ratingCount');
    expect(result.courses[0]?.enrollment.studentId).toBe(studentId);
    expect(result.courses[0]?.enrollment.enrolledAt).toBe(
      '2026-02-01T10:00:00.000Z',
    );
  });

  it('fetches courses, reviews, and progress in parallel for the student', async () => {
    vi.mocked(enrollmentRepository.findByStudentId).mockResolvedValue([
      createEnrollment({ id: 'enr-1', courseId: 'course-1' }),
    ]);
    vi.mocked(courseRepository.findByIds).mockResolvedValue([
      createCourse({ id: 'course-1', title: 'React' }),
    ]);

    await useCase.execute({ studentId, query: defaultQuery });

    expect(courseRepository.findByIds).toHaveBeenCalledWith(['course-1']);
    expect(reviewRepository.findByUserAndCourseIds).toHaveBeenCalledWith(
      studentId,
      ['course-1'],
    );
    expect(progressRepository.findStatsByEnrollmentIds).toHaveBeenCalledWith([
      { enrollmentId: 'enr-1', courseId: 'course-1' },
    ]);
  });

  it('filters by COMPLETED when status is provided', async () => {
    await useCase.execute({
      studentId,
      query: { ...defaultQuery, status: EnrollmentStatus.COMPLETED },
    });

    expect(enrollmentRepository.findByStudentId).toHaveBeenCalledWith({
      studentId,
      statuses: [EnrollmentStatus.COMPLETED],
      take: MAX_ENROLLMENTS_PER_STUDENT,
    });
  });
});
