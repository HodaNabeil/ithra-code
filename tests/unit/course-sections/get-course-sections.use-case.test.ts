import { CourseStatus, EnrollmentStatus, Role } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CourseSectionsError } from '@/features/courses/course-sections/errors/course-sections.errors';
import { getCourseSections } from '@/features/courses/course-sections/use-cases/get-course-sections.use-case';
import type { CourseSectionsRepository } from '@/features/courses/course-sections/repository/course-sections.repository';
import type { DB_CourseSectionsEntity } from '@/features/courses/course-sections/repository/course-sections.select';

const courseIdentity = {
  id: 'course-1',
  slug: 'nodejs-complete-guide',
  instructorId: 'instructor-1',
  status: CourseStatus.PUBLISHED,
};

const baseDate = new Date('2026-01-01T00:00:00.000Z');

const courseWithSections: DB_CourseSectionsEntity = {
  id: 'course-1',
  sections: [
    {
      id: 'section-1',
      courseId: 'course-1',
      title: 'Section 1',
      description: null,
      position: 1,
      isPublished: true,
      createdAt: baseDate,
      updatedAt: baseDate,
      lectures: [],
    },
  ],
};

const mockRepository: CourseSectionsRepository = {
  findCourseIdentity: vi.fn(),
  findSectionsWithLectures: vi.fn(),
  findEnrollment: vi.fn(),
  findProgressByEnrollment: vi.fn(),
};

vi.mock(
  '@/features/courses/course-sections/cache/course-sections.cache',
  () => ({
    courseSectionsCache: {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      invalidate: vi.fn().mockResolvedValue(undefined),
    },
  }),
);

vi.mock('@/lib/bunny-stream', () => ({
  signBunnyHlsUrl: vi.fn(() => null),
}));

describe('getCourseSections use-case', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockRepository.findCourseIdentity).mockResolvedValue(
      courseIdentity,
    );
    vi.mocked(mockRepository.findSectionsWithLectures).mockResolvedValue(
      courseWithSections,
    );
    vi.mocked(mockRepository.findEnrollment).mockResolvedValue(null);
    vi.mocked(mockRepository.findProgressByEnrollment).mockResolvedValue([]);
  });

  it('resolves course by slug and returns sections', async () => {
    const result = await getCourseSections(
      { idOrSlug: 'nodejs-complete-guide', user: null },
      mockRepository,
    );

    expect(mockRepository.findCourseIdentity).toHaveBeenCalledWith(
      'nodejs-complete-guide',
    );
    expect(result.total).toBe(1);
    expect(result.sections).toHaveLength(1);
  });

  it('throws 404 when course is not found', async () => {
    vi.mocked(mockRepository.findCourseIdentity).mockResolvedValue(null);

    await expect(
      getCourseSections(
        { idOrSlug: 'missing-course', user: null },
        mockRepository,
      ),
    ).rejects.toMatchObject({
      status: 404,
      message: expect.stringContaining('missing-course'),
    });
  });

  it('throws 404 for draft course accessed anonymously', async () => {
    vi.mocked(mockRepository.findCourseIdentity).mockResolvedValue({
      ...courseIdentity,
      status: CourseStatus.DRAFT,
    });

    await expect(
      getCourseSections(
        { idOrSlug: courseIdentity.slug, user: null },
        mockRepository,
      ),
    ).rejects.toBeInstanceOf(CourseSectionsError);
  });

  it('allows draft course for admin', async () => {
    vi.mocked(mockRepository.findCourseIdentity).mockResolvedValue({
      ...courseIdentity,
      status: CourseStatus.DRAFT,
    });

    const result = await getCourseSections(
      {
        idOrSlug: courseIdentity.slug,
        user: { id: 'admin-1', role: Role.ADMIN },
      },
      mockRepository,
    );

    expect(result.total).toBe(1);
    expect(mockRepository.findSectionsWithLectures).toHaveBeenCalledWith(
      'course-1',
      { publishedOnly: false },
    );
  });

  it('filters published content for anonymous users', async () => {
    await getCourseSections(
      { idOrSlug: courseIdentity.slug, user: null },
      mockRepository,
    );

    expect(mockRepository.findSectionsWithLectures).toHaveBeenCalledWith(
      'course-1',
      { publishedOnly: true },
    );
  });

  it('loads progress for ACTIVE enrollment', async () => {
    vi.mocked(mockRepository.findEnrollment).mockResolvedValue({
      id: 'enrollment-1',
      status: EnrollmentStatus.ACTIVE,
    });
    vi.mocked(mockRepository.findProgressByEnrollment).mockResolvedValue([
      {
        lectureId: 'lecture-1',
        isCompleted: true,
        timeSpent: 120,
        lastAccessedAt: baseDate,
        completedAt: baseDate,
      },
    ]);

    await getCourseSections(
      {
        idOrSlug: courseIdentity.slug,
        user: { id: 'student-1', role: Role.STUDENT },
      },
      mockRepository,
    );

    expect(mockRepository.findProgressByEnrollment).toHaveBeenCalledWith(
      'enrollment-1',
    );
  });

  it('does not load progress for DROPPED enrollment', async () => {
    vi.mocked(mockRepository.findEnrollment).mockResolvedValue({
      id: 'enrollment-1',
      status: EnrollmentStatus.DROPPED,
    });

    await getCourseSections(
      {
        idOrSlug: courseIdentity.slug,
        user: { id: 'student-1', role: Role.STUDENT },
      },
      mockRepository,
    );

    expect(mockRepository.findProgressByEnrollment).not.toHaveBeenCalled();
  });

  it('does not load progress for authenticated but unenrolled users', async () => {
    await getCourseSections(
      {
        idOrSlug: courseIdentity.slug,
        user: { id: 'student-1', role: Role.STUDENT },
      },
      mockRepository,
    );

    expect(mockRepository.findEnrollment).toHaveBeenCalled();
    expect(mockRepository.findProgressByEnrollment).not.toHaveBeenCalled();
  });
});
