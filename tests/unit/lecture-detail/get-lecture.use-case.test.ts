import {
  CourseStatus,
  EnrollmentStatus,
  LectureType,
  Role,
} from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LectureDetailError } from '@/features/courses/lecture-detail/errors/lecture-detail.errors';
import type { LectureDetailRepository } from '@/features/courses/lecture-detail/repository/lecture-detail.repository';
import type {
  DB_LectureDetailCourseEntity,
  DB_LectureDetailEntity,
} from '@/features/courses/lecture-detail/repository/lecture-detail.select';
import { getLecture } from '@/features/courses/lecture-detail/use-cases/get-lecture.use-case';

const lectureId = 'claaaaaaaaaaaaaaaaaaaaaa0';
const baseDate = new Date('2026-01-01T00:00:00.000Z');

const courseEntity: DB_LectureDetailCourseEntity = {
  id: 'claaaaaaaaaaaaaaaaaaaaaa1',
  instructorId: 'claaaaaaaaaaaaaaaaaaaaaa2',
  title: 'Node.js Course',
  slug: 'nodejs-complete-guide',
  description: 'Course description',
  shortDescription: 'Short',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  previewVideo: null,
  price: 99.99 as unknown as DB_LectureDetailCourseEntity['price'],
  compareAtPrice: null,
  currency: 'EGP',
  level: 'BEGINNER',
  status: CourseStatus.PUBLISHED,
  visibility: 'PUBLIC',
  isFeatured: false,
  duration: 120,
  requirements: ['JS basics'],
  objectives: ['Learn Node'],
  targetAudience: ['Developers'],
  tags: ['nodejs'],
  metaTitle: null,
  metaDescription: null,
  certificateEnabled: true,
  maxStudents: null,
  pathId: 'claaaaaaaaaaaaaaaaaaaaaa3',
  createdAt: baseDate,
  updatedAt: baseDate,
  publishedAt: baseDate,
  reviews: [],
};

const lectureEntity: DB_LectureDetailEntity = {
  id: lectureId,
  sectionId: 'claaaaaaaaaaaaaaaaaaaaaa4',
  title: 'Lecture 1',
  description: 'Lecture description',
  type: LectureType.VIDEO,
  content: null,
  videoId: null,
  position: 1,
  isPublished: true,
  isFree: true,
  createdAt: baseDate,
  updatedAt: baseDate,
  video: null,
  section: {
    course: courseEntity,
  },
};

const mockRepository: LectureDetailRepository = {
  findLectureById: vi.fn(),
  findEnrollment: vi.fn(),
  hasUserReviewedCourse: vi.fn(),
};

vi.mock('@/lib/bunny-stream', () => ({
  isBunnyStreamConfigured: vi.fn(() => false),
  signBunnyHlsUrl: vi.fn(() => null),
}));

describe('getLecture use-case', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockRepository.findLectureById).mockResolvedValue(lectureEntity);
    vi.mocked(mockRepository.findEnrollment).mockResolvedValue(null);
    vi.mocked(mockRepository.hasUserReviewedCourse).mockResolvedValue(false);
  });

  it('returns lecture and course for free published lecture', async () => {
    const result = await getLecture(
      {
        lectureId,
        user: { id: 'student-1', role: Role.STUDENT },
      },
      mockRepository,
    );

    expect(mockRepository.findLectureById).toHaveBeenCalledWith(lectureId);
    expect(result.lecture.id).toBe(lectureId);
    expect(result.course.slug).toBe('nodejs-complete-guide');
    expect(result.course.sections).toEqual([]);
    expect(result.course.lecturesCount).toBe(0);
    expect(result.course.isInCart).toBe(false);
    expect(result.hasPurchased).toBe(false);
    expect(result.hasRated).toBe(false);
  });

  it('throws 400 for invalid lectureId format', async () => {
    await expect(
      getLecture(
        {
          lectureId: 'invalid-id',
          user: { id: 'student-1', role: Role.STUDENT },
        },
        mockRepository,
      ),
    ).rejects.toMatchObject({
      status: 400,
      message: 'تنسيق المعرف غير صالح: "invalid-id"',
    });
  });

  it('throws 404 when lecture is not found', async () => {
    vi.mocked(mockRepository.findLectureById).mockResolvedValue(null);

    await expect(
      getLecture(
        {
          lectureId,
          user: { id: 'student-1', role: Role.STUDENT },
        },
        mockRepository,
      ),
    ).rejects.toMatchObject({
      status: 404,
      message: expect.stringContaining(lectureId),
    });
  });

  it('throws 404 when course cannot be resolved', async () => {
    vi.mocked(mockRepository.findLectureById).mockResolvedValue({
      ...lectureEntity,
      section: { course: null as unknown as DB_LectureDetailCourseEntity },
    });

    await expect(
      getLecture(
        {
          lectureId,
          user: { id: 'student-1', role: Role.STUDENT },
        },
        mockRepository,
      ),
    ).rejects.toMatchObject({
      status: 404,
      message: 'تعذر تحديد الدورة لهذه المحاضرة',
    });
  });

  it('throws 404 for unpublished lecture accessed by student', async () => {
    vi.mocked(mockRepository.findLectureById).mockResolvedValue({
      ...lectureEntity,
      isPublished: false,
    });

    await expect(
      getLecture(
        {
          lectureId,
          user: { id: 'student-1', role: Role.STUDENT },
        },
        mockRepository,
      ),
    ).rejects.toBeInstanceOf(LectureDetailError);
  });

  it('throws 403 for paid lecture without enrollment', async () => {
    vi.mocked(mockRepository.findLectureById).mockResolvedValue({
      ...lectureEntity,
      isFree: false,
    });

    await expect(
      getLecture(
        {
          lectureId,
          user: { id: 'student-1', role: Role.STUDENT },
        },
        mockRepository,
      ),
    ).rejects.toMatchObject({
      status: 403,
      message: 'يجب شراء هذه الدورة للوصول إلى محاضراتها',
    });
  });

  it('returns hasPurchased true for ACTIVE enrollment', async () => {
    vi.mocked(mockRepository.findLectureById).mockResolvedValue({
      ...lectureEntity,
      isFree: false,
    });
    vi.mocked(mockRepository.findEnrollment).mockResolvedValue({
      id: 'enrollment-1',
      status: EnrollmentStatus.ACTIVE,
    });

    const result = await getLecture(
      {
        lectureId,
        user: { id: 'student-1', role: Role.STUDENT },
      },
      mockRepository,
    );

    expect(result.hasPurchased).toBe(true);
    expect(result.course.isPurchased).toBe(true);
  });

  it('returns hasRated true when user reviewed course', async () => {
    vi.mocked(mockRepository.hasUserReviewedCourse).mockResolvedValue(true);

    const result = await getLecture(
      {
        lectureId,
        user: { id: 'student-1', role: Role.STUDENT },
      },
      mockRepository,
    );

    expect(result.hasRated).toBe(true);
  });

  it('allows admin to access draft unpublished paid lecture', async () => {
    vi.mocked(mockRepository.findLectureById).mockResolvedValue({
      ...lectureEntity,
      isPublished: false,
      isFree: false,
      section: {
        course: {
          ...courseEntity,
          status: CourseStatus.DRAFT,
        },
      },
    });

    const result = await getLecture(
      {
        lectureId,
        user: { id: 'admin-1', role: Role.ADMIN },
      },
      mockRepository,
    );

    expect(result.lecture.id).toBe(lectureId);
    expect(result.hasPurchased).toBe(true);
  });
});
