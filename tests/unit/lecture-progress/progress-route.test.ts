import { Role } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestAuthSession } from '../../helpers/auth-stub';

const mockUpdateLectureProgress = vi.fn();

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/features/courses/lecture-progress', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/courses/lecture-progress')>();
  return {
    ...actual,
    updateLectureProgress: (...args: unknown[]) =>
      mockUpdateLectureProgress(...args),
  };
});

import { auth } from '@/lib/auth';
import { PATCH } from '@/app/api/courses/[idOrSlug]/lectures/[lectureId]/progress/route';

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;

const lectureId = 'claaaaaaaaaaaaaaaaaaaaaa0';

function createRequest(body: unknown = {}): Request {
  return new Request('http://localhost/api/courses/slug/lectures/id/progress', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('PATCH /api/courses/[idOrSlug]/lectures/[lectureId]/progress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateLectureProgress.mockResolvedValue({
      id: 'progress-1',
      enrollmentId: 'enrollment-1',
      lectureId,
      isCompleted: false,
      completedAt: null,
      lastAccessedAt: '2026-06-01T10:00:00.000Z',
      timeSpent: 30,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-06-01T10:00:00.000Z',
    });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await PATCH(createRequest(), {
      params: Promise.resolve({ idOrSlug: 'course-slug', lectureId }),
    });

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(mockUpdateLectureProgress).not.toHaveBeenCalled();
  });

  it('returns 403 when user lacks progress:update permission', async () => {
    mockAuth.mockResolvedValue({
      ...createTestAuthSession('student-1', 'STUDENT'),
      user: {
        ...createTestAuthSession('student-1', 'STUDENT').user,
        role: 'UNKNOWN' as Role,
      },
      expires: '2099-01-01T00:00:00.000Z',
    });

    const response = await PATCH(createRequest(), {
      params: Promise.resolve({ idOrSlug: 'course-slug', lectureId }),
    });

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(mockUpdateLectureProgress).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid body', async () => {
    mockAuth.mockResolvedValue({
      ...createTestAuthSession('student-1', 'STUDENT'),
      expires: '2099-01-01T00:00:00.000Z',
    });

    const response = await PATCH(createRequest({ incrementTime: -5 }), {
      params: Promise.resolve({ idOrSlug: 'course-slug', lectureId }),
    });

    expect(response.status).toBe(400);
    expect(mockUpdateLectureProgress).not.toHaveBeenCalled();
  });

  it('returns 400 for unknown body fields', async () => {
    mockAuth.mockResolvedValue({
      ...createTestAuthSession('student-1', 'STUDENT'),
      expires: '2099-01-01T00:00:00.000Z',
    });

    const response = await PATCH(createRequest({ timeSpent: 300 }), {
      params: Promise.resolve({ idOrSlug: 'course-slug', lectureId }),
    });

    expect(response.status).toBe(400);
    expect(mockUpdateLectureProgress).not.toHaveBeenCalled();
  });

  it('returns 200 on successful update', async () => {
    mockAuth.mockResolvedValue({
      ...createTestAuthSession('student-1', 'STUDENT'),
      expires: '2099-01-01T00:00:00.000Z',
    });

    const response = await PATCH(createRequest({ incrementTime: 30 }), {
      params: Promise.resolve({ idOrSlug: 'wrong-slug', lectureId }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.message).toBe('تم تحديث تقدم المحاضرة بنجاح');
    expect(body.data.progress).toBeDefined();
    expect(mockUpdateLectureProgress).toHaveBeenCalledWith({
      lectureId,
      userId: 'student-1',
      isCompleted: false,
      incrementTime: 30,
    });
  });
});
