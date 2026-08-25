import { EnrollmentStatus } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LectureProgressError } from '@/features/courses/lecture-progress';
import type { LectureProgressRepository } from '@/features/courses/lecture-progress/repository/lecture-progress.repository';
import { updateLectureProgress } from '@/features/courses/lecture-progress/use-cases/update-lecture-progress.use-case';

const lectureId = 'claaaaaaaaaaaaaaaaaaaaaa0';
const userId = 'claaaaaaaaaaaaaaaaaaaaaa1';
const enrollmentId = 'claaaaaaaaaaaaaaaaaaaaaa2';
const courseId = 'claaaaaaaaaaaaaaaaaaaaaa3';
const baseDate = new Date('2026-01-01T00:00:00.000Z');

const lectureContext = {
  id: lectureId,
  courseId,
  videoDuration: 300,
};

const activeEnrollment = {
  id: enrollmentId,
  status: EnrollmentStatus.ACTIVE,
};

const progressRecord = {
  id: 'claaaaaaaaaaaaaaaaaaaaaa4',
  enrollmentId,
  lectureId,
  isCompleted: false,
  completedAt: null,
  lastAccessedAt: baseDate,
  timeSpent: 100,
  createdAt: baseDate,
  updatedAt: baseDate,
};

const mockRepository: LectureProgressRepository = {
  findLectureContext: vi.fn(),
  findEnrollment: vi.fn(),
  findProgress: vi.fn(),
  upsertProgressInTransaction: vi.fn(),
};

describe('updateLectureProgress use-case', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockRepository.findLectureContext).mockResolvedValue(
      lectureContext,
    );
    vi.mocked(mockRepository.findEnrollment).mockResolvedValue(
      activeEnrollment,
    );
    vi.mocked(mockRepository.findProgress).mockResolvedValue(null);
    vi.mocked(mockRepository.upsertProgressInTransaction).mockResolvedValue(
      progressRecord,
    );
  });

  it('returns progress for authenticated enrolled user', async () => {
    const result = await updateLectureProgress(
      {
        lectureId,
        userId,
        isCompleted: false,
        incrementTime: 30,
      },
      mockRepository,
    );

    expect(mockRepository.findLectureContext).toHaveBeenCalledWith(lectureId);
    expect(mockRepository.findEnrollment).toHaveBeenCalledWith(
      userId,
      courseId,
    );
    expect(mockRepository.upsertProgressInTransaction).toHaveBeenCalledWith({
      enrollmentId,
      lectureId,
      courseId,
      isCompleted: false,
      incrementTime: 30,
      videoDuration: 300,
    });
    expect(result.id).toBe(progressRecord.id);
    expect(result.lectureId).toBe(lectureId);
  });

  it('throws 400 for invalid lectureId format', async () => {
    await expect(
      updateLectureProgress(
        {
          lectureId: 'invalid-id',
          userId,
          isCompleted: false,
          incrementTime: 0,
        },
        mockRepository,
      ),
    ).rejects.toMatchObject({
      status: 400,
      message: 'تنسيق المعرف غير صالح: "invalid-id"',
    });
  });

  it('throws 404 when lecture is not found', async () => {
    vi.mocked(mockRepository.findLectureContext).mockResolvedValue(null);

    await expect(
      updateLectureProgress(
        {
          lectureId,
          userId,
          isCompleted: false,
          incrementTime: 0,
        },
        mockRepository,
      ),
    ).rejects.toMatchObject({
      status: 404,
      message: expect.stringContaining(lectureId),
    });
  });

  it('throws 403 when user has no enrollment', async () => {
    vi.mocked(mockRepository.findEnrollment).mockResolvedValue(null);

    await expect(
      updateLectureProgress(
        {
          lectureId,
          userId,
          isCompleted: false,
          incrementTime: 0,
        },
        mockRepository,
      ),
    ).rejects.toMatchObject({
      status: 403,
      message: 'أنت غير مسجل في هذا الكورس',
    });
  });

  it('throws 403 when enrollment is DROPPED', async () => {
    vi.mocked(mockRepository.findEnrollment).mockResolvedValue({
      id: enrollmentId,
      status: EnrollmentStatus.DROPPED,
    });

    await expect(
      updateLectureProgress(
        {
          lectureId,
          userId,
          isCompleted: false,
          incrementTime: 0,
        },
        mockRepository,
      ),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('throws 403 when enrollment is REVOKED', async () => {
    vi.mocked(mockRepository.findEnrollment).mockResolvedValue({
      id: enrollmentId,
      status: EnrollmentStatus.REVOKED,
    });

    await expect(
      updateLectureProgress(
        {
          lectureId,
          userId,
          isCompleted: false,
          incrementTime: 0,
        },
        mockRepository,
      ),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('throws 409 when progress is already completed', async () => {
    vi.mocked(mockRepository.findProgress).mockResolvedValue({
      ...progressRecord,
      isCompleted: true,
      completedAt: baseDate,
    });

    await expect(
      updateLectureProgress(
        {
          lectureId,
          userId,
          isCompleted: true,
          incrementTime: 0,
        },
        mockRepository,
      ),
    ).rejects.toMatchObject({
      status: 409,
      message: 'تم إكمال هذه المحاضرة مسبقاً',
    });

    expect(mockRepository.upsertProgressInTransaction).not.toHaveBeenCalled();
  });

  it('updates lastAccessedAt even with empty body defaults', async () => {
    const updatedDate = new Date('2026-06-01T10:00:00.000Z');
    vi.mocked(mockRepository.upsertProgressInTransaction).mockResolvedValue({
      ...progressRecord,
      lastAccessedAt: updatedDate,
      updatedAt: updatedDate,
    });

    const result = await updateLectureProgress(
      {
        lectureId,
        userId,
        isCompleted: false,
        incrementTime: 0,
      },
      mockRepository,
    );

    expect(result.lastAccessedAt).toBe(updatedDate.toISOString());
  });

  it('does not use courseIdOrSlug from URL (resolves course from lecture)', async () => {
    await updateLectureProgress(
      {
        lectureId,
        userId,
        isCompleted: false,
        incrementTime: 30,
      },
      mockRepository,
    );

    expect(mockRepository.findLectureContext).toHaveBeenCalledWith(lectureId);
    expect(mockRepository.findEnrollment).toHaveBeenCalledWith(
      userId,
      courseId,
    );
  });

  it('passes isCompleted true to repository for completion', async () => {
    const completedDate = new Date('2026-06-01T12:00:00.000Z');
    vi.mocked(mockRepository.upsertProgressInTransaction).mockResolvedValue({
      ...progressRecord,
      isCompleted: true,
      completedAt: completedDate,
      lastAccessedAt: completedDate,
      updatedAt: completedDate,
    });

    const result = await updateLectureProgress(
      {
        lectureId,
        userId,
        isCompleted: true,
        incrementTime: 30,
      },
      mockRepository,
    );

    expect(mockRepository.upsertProgressInTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ isCompleted: true }),
    );
    expect(result.isCompleted).toBe(true);
    expect(result.completedAt).toBe(completedDate.toISOString());
  });
});

describe('updateLectureProgress repository delegation', () => {
  it('rethrows LectureProgressError from repository transaction', async () => {
    vi.mocked(mockRepository.findLectureContext).mockResolvedValue(
      lectureContext,
    );
    vi.mocked(mockRepository.findEnrollment).mockResolvedValue(
      activeEnrollment,
    );
    vi.mocked(mockRepository.findProgress).mockResolvedValue(null);
    vi.mocked(mockRepository.upsertProgressInTransaction).mockRejectedValue(
      new LectureProgressError(409, 'تم إكمال هذه المحاضرة مسبقاً'),
    );

    await expect(
      updateLectureProgress(
        {
          lectureId,
          userId,
          isCompleted: false,
          incrementTime: 30,
        },
        mockRepository,
      ),
    ).rejects.toMatchObject({ status: 409 });
  });
});
