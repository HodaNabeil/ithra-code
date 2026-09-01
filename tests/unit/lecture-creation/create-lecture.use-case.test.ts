import { LectureType, Role } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LectureCreationError } from '@/features/courses/lecture-creation/errors/lecture-creation.errors';
import { COURSE_OWNERSHIP_FORBIDDEN_MESSAGE } from '@/features/courses/errors/course-authorization.errors';
import type { CreateLectureRepository } from '@/features/courses/lecture-creation/repository/create-lecture.repository';
import { createLectureUseCase } from '@/features/courses/lecture-creation/use-cases/create-lecture.use-case';

const mockInvalidateCourse = vi.fn();

vi.mock('@/features/courses/services/course-cache.service', () => ({
  courseCacheService: {
    invalidateCourse: (...args: unknown[]) => mockInvalidateCourse(...args),
  },
}));

const sectionId = 'claaaaaaaaaaaaaaaaaaaaaa0';
const instructorId = 'claaaaaaaaaaaaaaaaaaaaaa1';
const adminId = 'claaaaaaaaaaaaaaaaaaaaaa2';
const otherInstructorId = 'claaaaaaaaaaaaaaaaaaaaaa3';

const sectionWithCourse = {
  sectionId,
  courseId: 'claaaaaaaaaaaaaaaaaaaaaa4',
  courseSlug: 'nodejs-complete-guide',
  instructorId,
};

const createdLecture = {
  id: 'claaaaaaaaaaaaaaaaaaaaaa5',
  sectionId,
  title: 'Introduction to Next.js',
  description: 'Learn the basics of Next.js',
  type: LectureType.VIDEO,
  content: null,
  videoId: null,
  position: 0,
  isPublished: false,
  isFree: false,
};

const mockRepository: CreateLectureRepository = {
  findSectionWithCourse: vi.fn(),
  createLecture: vi.fn(),
};

const validBody = {
  title: 'Introduction to Next.js',
  description: 'Learn the basics of Next.js',
  type: LectureType.VIDEO,
};

describe('createLectureUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockRepository.findSectionWithCourse).mockResolvedValue(
      sectionWithCourse,
    );
    vi.mocked(mockRepository.createLecture).mockResolvedValue(createdLecture);
    mockInvalidateCourse.mockResolvedValue(undefined);
  });

  it('throws 404 when section does not exist', async () => {
    vi.mocked(mockRepository.findSectionWithCourse).mockResolvedValue(null);

    await expect(
      createLectureUseCase(
        {
          sectionId,
          body: validBody,
          user: { id: instructorId, role: Role.INSTRUCTOR },
        },
        mockRepository,
      ),
    ).rejects.toMatchObject({
      status: 404,
      code: 'SECTION_NOT_FOUND',
    });

    expect(mockRepository.createLecture).not.toHaveBeenCalled();
  });

  it('throws 403 when instructor does not own the course', async () => {
    await expect(
      createLectureUseCase(
        {
          sectionId,
          body: validBody,
          user: { id: otherInstructorId, role: Role.INSTRUCTOR },
        },
        mockRepository,
      ),
    ).rejects.toMatchObject({
      status: 403,
      code: 'OWNERSHIP_FORBIDDEN',
      message: COURSE_OWNERSHIP_FORBIDDEN_MESSAGE,
    });

    expect(mockRepository.createLecture).not.toHaveBeenCalled();
  });

  it('creates lecture when instructor owns the course', async () => {
    const result = await createLectureUseCase(
      {
        sectionId,
        body: validBody,
        user: { id: instructorId, role: Role.INSTRUCTOR },
      },
      mockRepository,
    );

    expect(result.lecture).toEqual(createdLecture);
    expect(mockRepository.createLecture).toHaveBeenCalledWith({
      sectionId,
      title: validBody.title,
      description: validBody.description,
      type: validBody.type,
    });
    expect(mockInvalidateCourse).toHaveBeenCalledWith('nodejs-complete-guide');
  });

  it('allows admin to create lecture without ownership', async () => {
    const result = await createLectureUseCase(
      {
        sectionId,
        body: validBody,
        user: { id: adminId, role: Role.ADMIN },
      },
      mockRepository,
    );

    expect(result.lecture).toEqual(createdLecture);
    expect(mockRepository.createLecture).toHaveBeenCalled();
  });

  it('delegates lecture persistence to the repository', async () => {
    await createLectureUseCase(
      {
        sectionId,
        body: validBody,
        user: { id: instructorId, role: Role.INSTRUCTOR },
      },
      mockRepository,
    );

    expect(mockRepository.createLecture).toHaveBeenCalledWith({
      sectionId,
      title: validBody.title,
      description: validBody.description,
      type: validBody.type,
    });
  });

  it('enforces server-side defaults via repository create', async () => {
    await createLectureUseCase(
      {
        sectionId,
        body: validBody,
        user: { id: instructorId, role: Role.INSTRUCTOR },
      },
      mockRepository,
    );

    const lecture = await vi.mocked(mockRepository.createLecture).mock.results[0]
      ?.value;
    expect(lecture).toEqual(
      expect.objectContaining({
        content: null,
        videoId: null,
        isPublished: false,
        isFree: false,
      }),
    );
  });

  it('throws 404 when course is missing from section context', async () => {
    vi.mocked(mockRepository.findSectionWithCourse).mockResolvedValue({
      sectionId,
      courseId: '',
      courseSlug: 'nodejs-complete-guide',
      instructorId,
    });

    await expect(
      createLectureUseCase(
        {
          sectionId,
          body: validBody,
          user: { id: instructorId, role: Role.INSTRUCTOR },
        },
        mockRepository,
      ),
    ).rejects.toMatchObject({
      status: 404,
      code: 'COURSE_NOT_FOUND',
    });
  });
});

describe('LectureCreationError', () => {
  it('carries status and code', () => {
    const error = new LectureCreationError(403, 'Forbidden', 'OWNERSHIP_FORBIDDEN');
    expect(error.status).toBe(403);
    expect(error.code).toBe('OWNERSHIP_FORBIDDEN');
    expect(error.message).toBe('Forbidden');
  });
});
