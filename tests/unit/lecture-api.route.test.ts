import { Role } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from '@/app/api/lectures/[lectureId]/route';
import { LectureDetailError } from '@/features/courses/lecture-detail';

const auth = vi.fn();
const getLecture = vi.fn();

vi.mock('@/lib/auth', () => ({
  auth: () => auth(),
}));

vi.mock('@/features/courses/lecture-detail', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/courses/lecture-detail')>();

  return {
    ...actual,
    getLecture: (...args: unknown[]) => getLecture(...args),
  };
});

const lectureId = 'clecture00000000000000001';

describe('GET /api/lectures/[lectureId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    auth.mockResolvedValue(null);

    const response = await GET(new Request('http://localhost:3000/api/lectures/x'), {
      params: Promise.resolve({ lectureId }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: 'Unauthorized',
    });
    expect(getLecture).not.toHaveBeenCalled();
  });

  it('returns 403 when user lacks LECTURE_READ permission', async () => {
    auth.mockResolvedValue({
      user: { id: 'cuser00000000000000001', role: 'UNKNOWN_ROLE' },
    });

    const response = await GET(new Request('http://localhost:3000/api/lectures/x'), {
      params: Promise.resolve({ lectureId }),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: 'ليس لديك صلاحية',
    });
    expect(getLecture).not.toHaveBeenCalled();
  });

  it('returns 200 with success envelope on success', async () => {
    auth.mockResolvedValue({
      user: { id: 'cstudent000000000000001', role: Role.STUDENT },
    });
    getLecture.mockResolvedValue({
      lecture: { id: lectureId, title: 'Lecture' },
      course: { id: 'ccourse00000000000000001', title: 'Course' },
      hasPurchased: true,
      hasRated: false,
    });

    const response = await GET(new Request('http://localhost:3000/api/lectures/x'), {
      params: Promise.resolve({ lectureId }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      message: 'تم جلب المحاضرة بنجاح',
      data: {
        lecture: { id: lectureId, title: 'Lecture' },
        course: { id: 'ccourse00000000000000001', title: 'Course' },
        hasPurchased: true,
        hasRated: false,
      },
    });
    expect(getLecture).toHaveBeenCalledWith({
      lectureId,
      user: { id: 'cstudent000000000000001', role: Role.STUDENT },
    });
  });

  it('maps LectureDetailError to apiError response', async () => {
    auth.mockResolvedValue({
      user: { id: 'cstudent000000000000001', role: Role.STUDENT },
    });
    getLecture.mockRejectedValue(
      new LectureDetailError(404, 'Not found', 'LECTURE_NOT_FOUND'),
    );

    const response = await GET(new Request('http://localhost:3000/api/lectures/x'), {
      params: Promise.resolve({ lectureId }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: 'Not found',
    });
  });
});
