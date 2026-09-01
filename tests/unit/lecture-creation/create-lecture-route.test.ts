import { LectureType, Role } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CourseAuthorizationError } from '@/features/courses/errors/course-authorization.errors';
import { LectureCreationError } from '@/features/courses/lecture-creation/errors/lecture-creation.errors';
import { createTestAuthSession } from '../../helpers/auth-stub';

const mockCreateLectureUseCase = vi.fn();

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/features/courses/lecture-creation', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('@/features/courses/lecture-creation')
    >();
  return {
    ...actual,
    createLectureUseCase: (...args: unknown[]) =>
      mockCreateLectureUseCase(...args),
  };
});

import { auth } from '@/lib/auth';
import { POST } from '@/app/api/sections/[sectionId]/lectures/route';

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;

const sectionId = 'claaaaaaaaaaaaaaaaaaaaaa0';
const instructorId = 'claaaaaaaaaaaaaaaaaaaaaa1';

const validBody = {
  title: 'Introduction to Next.js',
  description: 'Learn the basics of Next.js',
  type: 'VIDEO',
};

const createdResponse = {
  lecture: {
    id: 'claaaaaaaaaaaaaaaaaaaaaa5',
    sectionId,
    title: validBody.title,
    description: validBody.description,
    type: LectureType.VIDEO,
    content: null,
    videoId: null,
    position: 0,
    isPublished: false,
    isFree: false,
  },
};

function createRequest(body: unknown = validBody): Request {
  return new Request(`http://localhost/api/sections/${sectionId}/lectures`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/sections/[sectionId]/lectures', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateLectureUseCase.mockResolvedValue(createdResponse);
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await POST(createRequest(), {
      params: Promise.resolve({ sectionId }),
    });

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(mockCreateLectureUseCase).not.toHaveBeenCalled();
  });

  it('returns 403 when user lacks lecture:create permission', async () => {
    mockAuth.mockResolvedValue({
      ...createTestAuthSession('student-1', 'STUDENT'),
      expires: '2099-01-01T00:00:00.000Z',
    });

    const response = await POST(createRequest(), {
      params: Promise.resolve({ sectionId }),
    });

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(mockCreateLectureUseCase).not.toHaveBeenCalled();
  });

  it('returns 403 when role has no lecture:create permission', async () => {
    mockAuth.mockResolvedValue({
      ...createTestAuthSession('user-1', 'STUDENT'),
      user: {
        ...createTestAuthSession('user-1', 'STUDENT').user,
        role: 'UNKNOWN' as Role,
      },
      expires: '2099-01-01T00:00:00.000Z',
    });

    const response = await POST(createRequest(), {
      params: Promise.resolve({ sectionId }),
    });

    expect(response.status).toBe(403);
    expect(mockCreateLectureUseCase).not.toHaveBeenCalled();
  });

  it('returns 403 when instructor does not own the course', async () => {
    mockAuth.mockResolvedValue({
      ...createTestAuthSession(instructorId, 'INSTRUCTOR'),
      expires: '2099-01-01T00:00:00.000Z',
    });
    mockCreateLectureUseCase.mockRejectedValue(
      new CourseAuthorizationError(
        403,
        'You can only manage your own courses',
        'OWNERSHIP_FORBIDDEN',
      ),
    );

    const response = await POST(createRequest(), {
      params: Promise.resolve({ sectionId }),
    });

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it('returns 400 for invalid sectionId format', async () => {
    mockAuth.mockResolvedValue({
      ...createTestAuthSession(instructorId, 'INSTRUCTOR'),
      expires: '2099-01-01T00:00:00.000Z',
    });

    const response = await POST(createRequest(), {
      params: Promise.resolve({ sectionId: 'not-a-cuid' }),
    });

    expect(response.status).toBe(400);
    expect(mockCreateLectureUseCase).not.toHaveBeenCalled();
  });

  it('returns 400 when title is missing', async () => {
    mockAuth.mockResolvedValue({
      ...createTestAuthSession(instructorId, 'INSTRUCTOR'),
      expires: '2099-01-01T00:00:00.000Z',
    });

    const response = await POST(
      createRequest({ description: 'desc', type: 'VIDEO' }),
      { params: Promise.resolve({ sectionId }) },
    );

    expect(response.status).toBe(400);
    expect(mockCreateLectureUseCase).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid lecture type', async () => {
    mockAuth.mockResolvedValue({
      ...createTestAuthSession(instructorId, 'INSTRUCTOR'),
      expires: '2099-01-01T00:00:00.000Z',
    });

    const response = await POST(
      createRequest({ ...validBody, type: 'INVALID' }),
      { params: Promise.resolve({ sectionId }) },
    );

    expect(response.status).toBe(400);
    expect(mockCreateLectureUseCase).not.toHaveBeenCalled();
  });

  it('returns 400 for unknown body fields', async () => {
    mockAuth.mockResolvedValue({
      ...createTestAuthSession(instructorId, 'INSTRUCTOR'),
      expires: '2099-01-01T00:00:00.000Z',
    });

    const response = await POST(
      createRequest({ ...validBody, position: 10, isPublished: true }),
      { params: Promise.resolve({ sectionId }) },
    );

    expect(response.status).toBe(400);
    expect(mockCreateLectureUseCase).not.toHaveBeenCalled();
  });

  it('returns 404 when section does not exist', async () => {
    mockAuth.mockResolvedValue({
      ...createTestAuthSession(instructorId, 'INSTRUCTOR'),
      expires: '2099-01-01T00:00:00.000Z',
    });
    mockCreateLectureUseCase.mockRejectedValue(
      new LectureCreationError(404, 'Section not found', 'SECTION_NOT_FOUND'),
    );

    const response = await POST(createRequest(), {
      params: Promise.resolve({ sectionId }),
    });

    expect(response.status).toBe(404);
  });

  it('returns 201 for instructor who owns the course', async () => {
    mockAuth.mockResolvedValue({
      ...createTestAuthSession(instructorId, 'INSTRUCTOR'),
      expires: '2099-01-01T00:00:00.000Z',
    });

    const response = await POST(createRequest(), {
      params: Promise.resolve({ sectionId }),
    });

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.message).toBe('Lecture created successfully');
    expect(body.data.lecture).toEqual(createdResponse.lecture);
    expect(mockCreateLectureUseCase).toHaveBeenCalledWith({
      sectionId,
      body: {
        title: validBody.title,
        description: validBody.description,
        type: LectureType.VIDEO,
      },
      user: { id: instructorId, role: 'INSTRUCTOR' },
    });
  });

  it('returns 201 for admin without ownership requirement', async () => {
    mockAuth.mockResolvedValue({
      ...createTestAuthSession('admin-1', 'ADMIN'),
      expires: '2099-01-01T00:00:00.000Z',
    });

    const response = await POST(createRequest(), {
      params: Promise.resolve({ sectionId }),
    });

    expect(response.status).toBe(201);
    expect(mockCreateLectureUseCase).toHaveBeenCalledWith(
      expect.objectContaining({
        user: { id: 'admin-1', role: 'ADMIN' },
      }),
    );
  });
});
