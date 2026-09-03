import { EnrollmentStatus } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { lectureNotFoundMessage } from '@/features/courses/lecture-detail';
import type { CourseSectionsRepository } from '@/features/courses/course-sections/repository/course-sections.repository';
import { LectureProgressError } from '@/features/courses/lecture-progress/errors/lecture-progress.errors';
import type {
  LectureContext,
  LectureProgressRecord,
  LectureProgressRepository,
} from '@/features/courses/lecture-progress/repository/lecture-progress.repository';
import { getLectureProgress } from '@/features/courses/lecture-progress/use-cases/get-lecture-progress.use-case';

const lectureId = 'clecture00000000000000001';
const courseId = 'ccourse00000000000000001';
const courseSlug = 'test-course';
const userId = 'cstudent000000000000001';
const enrollmentId = 'cenrollment00000000001';
const otherUserId = 'cstudent000000000000002';
const otherEnrollmentId = 'cenrollment00000000002';

const lectureContext: LectureContext = {
  id: lectureId,
  courseId,
  videoDuration: 600,
};

const progressRecord: LectureProgressRecord = {
  id: 'cprogress000000000000001',
  enrollmentId,
  lectureId,
  isCompleted: true,
  completedAt: new Date('2026-06-01T10:00:00.000Z'),
  lastAccessedAt: new Date('2026-06-01T10:00:00.000Z'),
  timeSpent: 0,
  createdAt: new Date('2026-06-01T09:00:00.000Z'),
  updatedAt: new Date('2026-06-01T10:00:00.000Z'),
};

function createProgressRepository(
  overrides: Partial<LectureProgressRepository> = {},
): LectureProgressRepository {
  return {
    findLectureContext: vi.fn().mockResolvedValue(lectureContext),
    findEnrollment: vi.fn().mockResolvedValue({
      id: enrollmentId,
      status: EnrollmentStatus.ACTIVE,
    }),
    findProgress: vi.fn().mockResolvedValue(progressRecord),
    upsertProgressInTransaction: vi.fn(),
    ...overrides,
  };
}

function createCourseRepository(
  overrides: Partial<CourseSectionsRepository> = {},
): CourseSectionsRepository {
  return {
    findCourseIdentity: vi.fn().mockResolvedValue({
      id: courseId,
      slug: courseSlug,
      instructorId: 'cinstructor0000000000001',
      status: 'PUBLISHED',
    }),
    findSectionsWithLectures: vi.fn(),
    findEnrollment: vi.fn(),
    findProgressByEnrollment: vi.fn(),
    ...overrides,
  };
}

describe('getLectureProgress', () => {
  it('throws 400 for invalid lectureId', async () => {
    const repository = createProgressRepository();
    const courseRepository = createCourseRepository();

    await expect(
      getLectureProgress(
        {
          courseIdOrSlug: courseSlug,
          lectureId: 'invalid-id',
          userId,
        },
        repository,
        courseRepository,
      ),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('throws 404 when lecture is not found', async () => {
    const repository = createProgressRepository({
      findLectureContext: vi.fn().mockResolvedValue(null),
    });
    const courseRepository = createCourseRepository();

    await expect(
      getLectureProgress(
        { courseIdOrSlug: courseSlug, lectureId, userId },
        repository,
        courseRepository,
      ),
    ).rejects.toMatchObject({
      status: 404,
      code: 'LECTURE_NOT_FOUND',
      message: lectureNotFoundMessage(lectureId),
    });
  });

  it('throws 404 when URL course does not match lecture course', async () => {
    const repository = createProgressRepository();
    const courseRepository = createCourseRepository({
      findCourseIdentity: vi.fn().mockResolvedValue({
        id: 'cothercourse000000000001',
        slug: 'other-course',
        instructorId: 'cinstructor0000000000001',
        status: 'PUBLISHED',
      }),
    });

    await expect(
      getLectureProgress(
        { courseIdOrSlug: courseSlug, lectureId, userId },
        repository,
        courseRepository,
      ),
    ).rejects.toMatchObject({
      status: 404,
      code: 'LECTURE_NOT_FOUND',
      message: lectureNotFoundMessage(lectureId),
    });
  });

  it('throws 404 when URL course is not found', async () => {
    const repository = createProgressRepository();
    const courseRepository = createCourseRepository({
      findCourseIdentity: vi.fn().mockResolvedValue(null),
    });

    await expect(
      getLectureProgress(
        { courseIdOrSlug: courseSlug, lectureId, userId },
        repository,
        courseRepository,
      ),
    ).rejects.toMatchObject({
      status: 404,
      code: 'LECTURE_NOT_FOUND',
    });
  });

  it.each([
    ['missing enrollment', null],
    ['DROPPED enrollment', { id: enrollmentId, status: EnrollmentStatus.DROPPED }],
    ['REVOKED enrollment', { id: enrollmentId, status: EnrollmentStatus.REVOKED }],
  ])('throws 404 for %s (masked as lecture not found)', async (_label, enrollment) => {
    const repository = createProgressRepository({
      findEnrollment: vi.fn().mockResolvedValue(enrollment),
    });
    const courseRepository = createCourseRepository();

    await expect(
      getLectureProgress(
        { courseIdOrSlug: courseSlug, lectureId, userId },
        repository,
        courseRepository,
      ),
    ).rejects.toMatchObject({
      status: 404,
      code: 'LECTURE_NOT_FOUND',
      message: lectureNotFoundMessage(lectureId),
    });

    expect(repository.findProgress).not.toHaveBeenCalled();
  });

  it.each([
    ['ACTIVE', EnrollmentStatus.ACTIVE],
    ['COMPLETED', EnrollmentStatus.COMPLETED],
  ])('allows %s enrollment', async (_label, status) => {
    const repository = createProgressRepository({
      findEnrollment: vi.fn().mockResolvedValue({ id: enrollmentId, status }),
      findProgress: vi.fn().mockResolvedValue(null),
    });
    const courseRepository = createCourseRepository();

    const result = await getLectureProgress(
      { courseIdOrSlug: courseSlug, lectureId, userId },
      repository,
      courseRepository,
    );

    expect(result).toBeNull();
    expect(repository.findEnrollment).toHaveBeenCalledWith(userId, courseId);
    expect(repository.findProgress).toHaveBeenCalledWith(enrollmentId, lectureId);
  });

  it('returns null when no progress record exists', async () => {
    const repository = createProgressRepository({
      findProgress: vi.fn().mockResolvedValue(null),
    });
    const courseRepository = createCourseRepository();

    const result = await getLectureProgress(
      { courseIdOrSlug: courseSlug, lectureId, userId },
      repository,
      courseRepository,
    );

    expect(result).toBeNull();
  });

  it('returns mapped progress when record exists', async () => {
    const repository = createProgressRepository();
    const courseRepository = createCourseRepository();

    const result = await getLectureProgress(
      { courseIdOrSlug: courseSlug, lectureId, userId },
      repository,
      courseRepository,
    );

    expect(result).toEqual({
      id: progressRecord.id,
      enrollmentId,
      lectureId,
      isCompleted: true,
      completedAt: '2026-06-01T10:00:00.000Z',
      lastAccessedAt: '2026-06-01T10:00:00.000Z',
      timeSpent: 0,
      createdAt: '2026-06-01T09:00:00.000Z',
      updatedAt: '2026-06-01T10:00:00.000Z',
    });
  });

  it('scopes progress lookup to the authenticated user enrollment (IDOR protection)', async () => {
    const findEnrollment = vi
      .fn()
      .mockImplementation(async (studentId: string) => {
        if (studentId === userId) {
          return { id: enrollmentId, status: EnrollmentStatus.ACTIVE };
        }
        if (studentId === otherUserId) {
          return { id: otherEnrollmentId, status: EnrollmentStatus.ACTIVE };
        }
        return null;
      });

    const findProgress = vi
      .fn()
      .mockImplementation(
        async (enrollment: string, lecture: string) => {
          if (enrollment === enrollmentId && lecture === lectureId) {
            return progressRecord;
          }
          return null;
        },
      );

    const repository = createProgressRepository({
      findEnrollment,
      findProgress,
    });
    const courseRepository = createCourseRepository();

    const result = await getLectureProgress(
      { courseIdOrSlug: courseSlug, lectureId, userId },
      repository,
      courseRepository,
    );

    expect(findEnrollment).toHaveBeenCalledWith(userId, courseId);
    expect(findProgress).toHaveBeenCalledWith(enrollmentId, lectureId);
    expect(findProgress).not.toHaveBeenCalledWith(otherEnrollmentId, lectureId);
    expect(result?.enrollmentId).toBe(enrollmentId);
  });

  it('denies access when user is not enrolled in the lecture course', async () => {
    const repository = createProgressRepository({
      findEnrollment: vi.fn().mockResolvedValue(null),
    });
    const courseRepository = createCourseRepository();

    await expect(
      getLectureProgress(
        { courseIdOrSlug: courseSlug, lectureId, userId: otherUserId },
        repository,
        courseRepository,
      ),
    ).rejects.toBeInstanceOf(LectureProgressError);

    expect(repository.findProgress).not.toHaveBeenCalled();
  });

  it('does not call upsertProgressInTransaction (read-only)', async () => {
    const repository = createProgressRepository();
    const courseRepository = createCourseRepository();

    await getLectureProgress(
      { courseIdOrSlug: courseSlug, lectureId, userId },
      repository,
      courseRepository,
    );

    expect(repository.upsertProgressInTransaction).not.toHaveBeenCalled();
  });

  it('uses the same masked 404 message for lecture not found and enrollment denial', async () => {
    const notFoundRepository = createProgressRepository({
      findLectureContext: vi.fn().mockResolvedValue(null),
    });
    const deniedRepository = createProgressRepository({
      findEnrollment: vi.fn().mockResolvedValue(null),
    });
    const courseRepository = createCourseRepository();
    const input = { courseIdOrSlug: courseSlug, lectureId, userId };
    const expectedMessage = lectureNotFoundMessage(lectureId);

    await expect(
      getLectureProgress(input, notFoundRepository, courseRepository),
    ).rejects.toMatchObject({ status: 404, message: expectedMessage });

    await expect(
      getLectureProgress(input, deniedRepository, courseRepository),
    ).rejects.toMatchObject({ status: 404, message: expectedMessage });
  });
});
