import { Role } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from '@/app/api/courses/[idOrSlug]/lectures/[lectureId]/progress/route';
import { LectureProgressError } from '@/features/courses/lecture-progress';

const auth = vi.fn();
const getLectureProgress = vi.fn();

vi.mock('@/lib/auth', () => ({
  auth: () => auth(),
}));

vi.mock(
  '@/features/courses/lecture-progress/use-cases/get-lecture-progress.use-case',
  () => ({
    getLectureProgress: (...args: unknown[]) => getLectureProgress(...args),
  }),
);

const idOrSlug = 'test-course';
const lectureId = 'clecture00000000000000001';
const studentId = 'cstudent000000000000001';

const progressDto = {
  id: 'cprogress000000000000001',
  enrollmentId: 'cenrollment00000000001',
  lectureId,
  isCompleted: false,
  completedAt: null,
  lastAccessedAt: '2026-06-01T10:00:00.000Z',
  timeSpent: 120,
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-01T10:00:00.000Z',
};

describe('GET /api/courses/[idOrSlug]/lectures/[lectureId]/progress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    auth.mockResolvedValue(null);

    const response = await GET(
      new Request('http://localhost:3000/api/courses/x/lectures/y/progress'),
      {
        params: Promise.resolve({ idOrSlug, lectureId }),
      },
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: 'Unauthorized',
    });
    expect(getLectureProgress).not.toHaveBeenCalled();
  });

  it('returns 403 when user lacks PROGRESS_READ permission', async () => {
    auth.mockResolvedValue({
      user: { id: studentId, role: 'UNKNOWN_ROLE' },
    });

    const response = await GET(
      new Request('http://localhost:3000/api/courses/x/lectures/y/progress'),
      {
        params: Promise.resolve({ idOrSlug, lectureId }),
      },
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: 'ليس لديك صلاحية',
    });
    expect(getLectureProgress).not.toHaveBeenCalled();
  });

  it('returns 200 with progress object on success', async () => {
    auth.mockResolvedValue({
      user: { id: studentId, role: Role.STUDENT },
    });
    getLectureProgress.mockResolvedValue(progressDto);

    const response = await GET(
      new Request('http://localhost:3000/api/courses/x/lectures/y/progress'),
      {
        params: Promise.resolve({ idOrSlug, lectureId }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      message: 'تم جلب تقدم المحاضرة بنجاح',
      data: { progress: progressDto },
    });
    expect(getLectureProgress).toHaveBeenCalledWith({
      courseIdOrSlug: idOrSlug,
      lectureId,
      userId: studentId,
    });
  });

  it('returns 200 with progress null when user has no progress yet', async () => {
    auth.mockResolvedValue({
      user: { id: studentId, role: Role.STUDENT },
    });
    getLectureProgress.mockResolvedValue(null);

    const response = await GET(
      new Request('http://localhost:3000/api/courses/x/lectures/y/progress'),
      {
        params: Promise.resolve({ idOrSlug, lectureId }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      message: 'تم جلب تقدم المحاضرة بنجاح',
      data: { progress: null },
    });
  });

  it('passes userId only from session.user.id', async () => {
    auth.mockResolvedValue({
      user: { id: studentId, role: Role.STUDENT },
    });
    getLectureProgress.mockResolvedValue(null);

    await GET(
      new Request('http://localhost:3000/api/courses/x/lectures/y/progress'),
      {
        params: Promise.resolve({ idOrSlug, lectureId }),
      },
    );

    expect(getLectureProgress).toHaveBeenCalledWith(
      expect.objectContaining({ userId: studentId }),
    );
    expect(getLectureProgress).not.toHaveBeenCalledWith(
      expect.objectContaining({ userId: expect.not.stringMatching(studentId) }),
    );
  });

  it('maps LectureProgressError to apiError response', async () => {
    auth.mockResolvedValue({
      user: { id: studentId, role: Role.STUDENT },
    });
    getLectureProgress.mockRejectedValue(
      new LectureProgressError(404, 'Not found', 'LECTURE_NOT_FOUND'),
    );

    const response = await GET(
      new Request('http://localhost:3000/api/courses/x/lectures/y/progress'),
      {
        params: Promise.resolve({ idOrSlug, lectureId }),
      },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: 'Not found',
    });
  });

  it('returns 500 on unexpected errors', async () => {
    auth.mockResolvedValue({
      user: { id: studentId, role: Role.STUDENT },
    });
    getLectureProgress.mockRejectedValue(new Error('unexpected'));

    const response = await GET(
      new Request('http://localhost:3000/api/courses/x/lectures/y/progress'),
      {
        params: Promise.resolve({ idOrSlug, lectureId }),
      },
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: 'Internal Error',
    });
  });
});
