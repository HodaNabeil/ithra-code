import { Role } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestAuthSession } from '../../helpers/auth-stub';

const mockListStudentEnrollments = vi.fn();

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock(
  '@/features/enrollments/infrastructure/di/enrollments.container',
  () => ({
    listStudentEnrollments: (...args: unknown[]) =>
      mockListStudentEnrollments(...args),
  }),
);

import { auth } from '@/lib/auth';
import { GET } from '@/app/api/enrollments/route';

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;

const listResult = {
  courses: [],
  pagination: {
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 10,
  },
};

function createRequest(search = ''): Request {
  const url = search
    ? `http://localhost/api/enrollments?${search}`
    : 'http://localhost/api/enrollments';
  return new Request(url, { method: 'GET' });
}

describe('GET /api/enrollments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListStudentEnrollments.mockResolvedValue(listResult);
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET(createRequest());

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ success: false, message: 'Unauthorized' });
    expect(mockListStudentEnrollments).not.toHaveBeenCalled();
  });

  it('returns 403 when the user lacks enrollment:read', async () => {
    mockAuth.mockResolvedValue({
      ...createTestAuthSession('student-1', 'STUDENT'),
      user: {
        ...createTestAuthSession('student-1', 'STUDENT').user,
        role: 'UNKNOWN' as Role,
      },
      expires: '2099-01-01T00:00:00.000Z',
    });

    const response = await GET(createRequest());

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body).toEqual({ success: false, message: 'ليس لديك صلاحية' });
    expect(mockListStudentEnrollments).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid query parameters', async () => {
    mockAuth.mockResolvedValue({
      ...createTestAuthSession('student-1', 'STUDENT'),
      expires: '2099-01-01T00:00:00.000Z',
    });

    const response = await GET(createRequest('page=0'));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(mockListStudentEnrollments).not.toHaveBeenCalled();
  });

  it('returns 200 and uses the authenticated user id only', async () => {
    mockAuth.mockResolvedValue({
      ...createTestAuthSession('student-1', 'STUDENT'),
      expires: '2099-01-01T00:00:00.000Z',
    });

    const response = await GET(
      createRequest(
        'status=ACTIVE&search=JavaScript&sortBy=enrolledAt&sortOrder=desc&page=1&limit=10&userId=someone-else',
      ),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.message).toBe('تم جلب التسجيلات بنجاح');
    expect(body.data).toEqual(listResult);
    expect(mockListStudentEnrollments).toHaveBeenCalledWith({
      studentId: 'student-1',
      query: {
        page: 1,
        limit: 10,
        search: 'JavaScript',
        sortBy: 'enrolledAt',
        sortOrder: 'desc',
        status: 'ACTIVE',
      },
    });
  });
});
