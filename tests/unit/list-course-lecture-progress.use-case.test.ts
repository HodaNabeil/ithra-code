import { EnrollmentStatus } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { courseNotFoundMessage } from '@/features/courses/course-sections/errors/course-sections.errors';
import type { CourseSectionsRepository } from '@/features/courses/course-sections/repository/course-sections.repository';
import { LectureProgressError } from '@/features/courses/lecture-progress/errors/lecture-progress.errors';
import type { LectureProgressRepository } from '@/features/courses/lecture-progress/repository/lecture-progress.repository';
import { listCourseLectureProgress } from '@/features/courses/lecture-progress/use-cases/list-course-lecture-progress.use-case';

function createCourseRepositoryMock(): CourseSectionsRepository {
  return {
    findCourseIdByIdOrSlug: vi.fn(),
    findCourseIdentity: vi.fn(),
    findSectionsWithLectures: vi.fn(),
    findEnrollment: vi.fn(),
    findProgressByEnrollment: vi.fn(),
  };
}

function createProgressRepositoryMock(): LectureProgressRepository {
  return {
    findLectureContext: vi.fn(),
    findEnrollment: vi.fn(),
    findProgress: vi.fn(),
    findByEnrollmentId: vi.fn(),
    upsertProgressInTransaction: vi.fn(),
  };
}

describe('listCourseLectureProgress use case', () => {
  it('uses lightweight course id lookup and enrollment-scoped progress query', async () => {
    const courseRepository = createCourseRepositoryMock();
    const progressRepository = createProgressRepositoryMock();
    const createdAt = new Date('2026-01-01T10:00:00.000Z');

    vi.mocked(courseRepository.findCourseIdByIdOrSlug).mockResolvedValue({
      id: 'course-1',
    });
    vi.mocked(courseRepository.findEnrollment).mockResolvedValue({
      id: 'enrollment-1',
      status: EnrollmentStatus.ACTIVE,
    });
    vi.mocked(progressRepository.findByEnrollmentId).mockResolvedValue([
      {
        id: 'progress-1',
        enrollmentId: 'enrollment-1',
        lectureId: 'lecture-1',
        isCompleted: true,
        completedAt: createdAt,
        lastAccessedAt: createdAt,
        timeSpent: 120,
        createdAt,
        updatedAt: createdAt,
      },
    ]);

    const result = await listCourseLectureProgress(
      {
        courseIdOrSlug: 'progress-course-slug',
        userId: 'user-1',
      },
      courseRepository,
      progressRepository,
    );

    expect(courseRepository.findCourseIdByIdOrSlug).toHaveBeenCalledWith(
      'progress-course-slug',
    );
    expect(courseRepository.findSectionsWithLectures).not.toHaveBeenCalled();
    expect(courseRepository.findEnrollment).toHaveBeenCalledWith(
      'user-1',
      'course-1',
    );
    expect(progressRepository.findByEnrollmentId).toHaveBeenCalledWith(
      'enrollment-1',
    );
    expect(result).toEqual({
      progress: [
        expect.objectContaining({
          id: 'progress-1',
          enrollmentId: 'enrollment-1',
          lectureId: 'lecture-1',
          timeSpent: 120,
        }),
      ],
      total: 1,
    });
  });

  it('masks missing enrollment as course not found', async () => {
    const courseRepository = createCourseRepositoryMock();
    const progressRepository = createProgressRepositoryMock();

    vi.mocked(courseRepository.findCourseIdByIdOrSlug).mockResolvedValue({
      id: 'course-1',
    });
    vi.mocked(courseRepository.findEnrollment).mockResolvedValue(null);

    await expect(
      listCourseLectureProgress(
        {
          courseIdOrSlug: 'progress-course-slug',
          userId: 'user-1',
        },
        courseRepository,
        progressRepository,
      ),
    ).rejects.toMatchObject({
      status: 404,
      message: courseNotFoundMessage('progress-course-slug'),
    });

    expect(progressRepository.findByEnrollmentId).not.toHaveBeenCalled();
  });

  it('masks missing course and denied enrollment with the same not-found message', async () => {
    const courseRepository = createCourseRepositoryMock();
    const progressRepository = createProgressRepositoryMock();

    vi.mocked(courseRepository.findCourseIdByIdOrSlug).mockResolvedValue(null);

    await expect(
      listCourseLectureProgress(
        {
          courseIdOrSlug: 'missing-course',
          userId: 'user-1',
        },
        courseRepository,
        progressRepository,
      ),
    ).rejects.toMatchObject({
      status: 404,
      message: courseNotFoundMessage('missing-course'),
      code: 'COURSE_NOT_FOUND',
    });

    vi.mocked(courseRepository.findCourseIdByIdOrSlug).mockResolvedValue({
      id: 'course-1',
    });
    vi.mocked(courseRepository.findEnrollment).mockResolvedValue({
      id: 'enrollment-1',
      status: EnrollmentStatus.DROPPED,
    });

    await expect(
      listCourseLectureProgress(
        {
          courseIdOrSlug: 'missing-course',
          userId: 'user-1',
        },
        courseRepository,
        progressRepository,
      ),
    ).rejects.toMatchObject({
      status: 404,
      message: courseNotFoundMessage('missing-course'),
      code: 'NOT_ENROLLED',
    });
  });

  it('returns an empty list for enrolled users without progress rows', async () => {
    const courseRepository = createCourseRepositoryMock();
    const progressRepository = createProgressRepositoryMock();

    vi.mocked(courseRepository.findCourseIdByIdOrSlug).mockResolvedValue({
      id: 'course-1',
    });
    vi.mocked(courseRepository.findEnrollment).mockResolvedValue({
      id: 'enrollment-1',
      status: EnrollmentStatus.ACTIVE,
    });
    vi.mocked(progressRepository.findByEnrollmentId).mockResolvedValue([]);

    const result = await listCourseLectureProgress(
      {
        courseIdOrSlug: 'progress-course-slug',
        userId: 'user-1',
      },
      courseRepository,
      progressRepository,
    );

    expect(result).toEqual({ progress: [], total: 0 });
  });

  it('throws LectureProgressError for invalid params', async () => {
    const courseRepository = createCourseRepositoryMock();
    const progressRepository = createProgressRepositoryMock();

    await expect(
      listCourseLectureProgress(
        {
          courseIdOrSlug: '',
          userId: 'user-1',
        },
        courseRepository,
        progressRepository,
      ),
    ).rejects.toBeInstanceOf(LectureProgressError);
  });
});
