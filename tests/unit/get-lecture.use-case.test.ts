import { CourseStatus, LectureType, Prisma, Role } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { getLecture } from '@/features/courses/lecture-detail/use-cases/get-lecture.use-case';
import type { LectureDetailRepository } from '@/features/courses/lecture-detail/repository/lecture-detail.repository';
import type { DB_LectureDetailEntity } from '@/features/courses/lecture-detail/repository/lecture-detail.select';

const lectureId = 'clecture00000000000000001';
const courseId = 'ccourse00000000000000001';
const instructorId = 'cinstructor0000000000001';
const studentId = 'cstudent000000000000001';

function createLecture(
  overrides: Partial<DB_LectureDetailEntity> = {},
): DB_LectureDetailEntity {
  return {
    id: lectureId,
    sectionId: 'csection0000000000000001',
    title: 'Test Lecture',
    description: 'Description',
    type: LectureType.VIDEO,
    content: null,
    videoId: 'cvideo00000000000000001',
    position: 1,
    isPublished: true,
    isFree: false,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    video: {
      id: 'cvideo00000000000000001',
      bunnyVideoId: 'bunny-1',
      libraryId: 'lib-1',
      status: 'processing',
    },
    section: {
      course: {
        id: courseId,
        instructorId,
        title: 'Test Course',
        slug: 'test-course',
        description: 'Course description',
        shortDescription: null,
        thumbnailUrl: 'https://example.com/thumb.jpg',
        previewVideo: null,
        price: new Prisma.Decimal(100),
        compareAtPrice: null,
        currency: 'USD',
        level: 'BEGINNER',
        status: CourseStatus.PUBLISHED,
        visibility: 'PUBLIC',
        isFeatured: false,
        duration: 120,
        requirements: [],
        objectives: [],
        targetAudience: [],
        tags: [],
        metaTitle: null,
        metaDescription: null,
        certificateEnabled: false,
        maxStudents: null,
        pathId: 'cpath000000000000000001',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        publishedAt: new Date('2024-01-01T00:00:00.000Z'),
      },
    },
    ...overrides,
  };
}

function createRepository(
  overrides: Partial<LectureDetailRepository> = {},
): LectureDetailRepository {
  return {
    findLectureById: vi.fn().mockResolvedValue(createLecture()),
    findValidEnrollment: vi.fn().mockResolvedValue({ id: 'cenrollment00001' }),
    hasUserReviewedCourse: vi.fn().mockResolvedValue(false),
    getCourseRatingAggregate: vi
      .fn()
      .mockResolvedValue({ rating: 4.5, ratingCount: 10 }),
    ...overrides,
  };
}

describe('getLecture', () => {
  it('throws 400 for invalid lecture ID', async () => {
    const repository = createRepository();

    await expect(
      getLecture(
        {
          lectureId: 'invalid-id',
          user: { id: studentId, role: Role.STUDENT },
        },
        repository,
      ),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('throws 404 when lecture is not found', async () => {
    const repository = createRepository({
      findLectureById: vi.fn().mockResolvedValue(null),
    });

    await expect(
      getLecture(
        {
          lectureId,
          user: { id: studentId, role: Role.STUDENT },
        },
        repository,
      ),
    ).rejects.toMatchObject({ status: 404, code: 'LECTURE_NOT_FOUND' });
  });

  it('throws 404 when course cannot be resolved', async () => {
    const lectureWithoutCourse = {
      ...createLecture(),
      section: { course: null },
    } as unknown as DB_LectureDetailEntity;

    const repository = createRepository({
      findLectureById: vi.fn().mockResolvedValue(lectureWithoutCourse),
    });

    await expect(
      getLecture(
        {
          lectureId,
          user: { id: studentId, role: Role.STUDENT },
        },
        repository,
      ),
    ).rejects.toMatchObject({ status: 404, code: 'COURSE_UNRESOLVED' });
  });

  it('throws 403 when paid lecture has no enrollment', async () => {
    const repository = createRepository({
      findValidEnrollment: vi.fn().mockResolvedValue(null),
    });

    await expect(
      getLecture(
        {
          lectureId,
          user: { id: studentId, role: Role.STUDENT },
        },
        repository,
      ),
    ).rejects.toMatchObject({
      status: 403,
      code: 'LECTURE_PURCHASE_REQUIRED',
    });
  });

  it('skips enrollment query for admin and runs parallel review + rating', async () => {
    const repository = createRepository();

    await getLecture(
      {
        lectureId,
        user: { id: 'cadmin0000000000000001', role: Role.ADMIN },
      },
      repository,
    );

    expect(repository.findValidEnrollment).not.toHaveBeenCalled();
    expect(repository.hasUserReviewedCourse).toHaveBeenCalledWith(
      courseId,
      'cadmin0000000000000001',
    );
    expect(repository.getCourseRatingAggregate).toHaveBeenCalledWith(courseId);
  });

  it('skips enrollment query for course instructor', async () => {
    const repository = createRepository();

    await getLecture(
      {
        lectureId,
        user: { id: instructorId, role: Role.INSTRUCTOR },
      },
      repository,
    );

    expect(repository.findValidEnrollment).not.toHaveBeenCalled();
  });

  it('queries enrollment, review, and rating for students', async () => {
    const repository = createRepository({
      hasUserReviewedCourse: vi.fn().mockResolvedValue(true),
      getCourseRatingAggregate: vi
        .fn()
        .mockResolvedValue({ rating: 4, ratingCount: 2 }),
    });

    const result = await getLecture(
      {
        lectureId,
        user: { id: studentId, role: Role.STUDENT },
      },
      repository,
    );

    expect(repository.findValidEnrollment).toHaveBeenCalledWith(
      studentId,
      courseId,
    );
    expect(repository.hasUserReviewedCourse).toHaveBeenCalledWith(
      courseId,
      studentId,
    );
    expect(repository.getCourseRatingAggregate).toHaveBeenCalledWith(courseId);
    expect(result.hasRated).toBe(true);
    expect(result.hasPurchased).toBe(true);
    expect(result.course.rating).toBe(4);
    expect(result.course.ratingCount).toBe(2);
  });

  it('returns hasRated false when user has not reviewed', async () => {
    const repository = createRepository({
      hasUserReviewedCourse: vi.fn().mockResolvedValue(false),
    });

    const result = await getLecture(
      {
        lectureId,
        user: { id: studentId, role: Role.STUDENT },
      },
      repository,
    );

    expect(result.hasRated).toBe(false);
  });
});
