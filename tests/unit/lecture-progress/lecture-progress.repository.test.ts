import { EnrollmentStatus } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaLectureProgressRepository } from '@/features/courses/lecture-progress/repository/lecture-progress.repository';

const enrollmentId = 'claaaaaaaaaaaaaaaaaaaaaa2';
const lectureId = 'claaaaaaaaaaaaaaaaaaaaaa0';
const courseId = 'claaaaaaaaaaaaaaaaaaaaaa3';
const baseDate = new Date('2026-01-01T00:00:00.000Z');

const mockTx = {
  progress: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    count: vi.fn(),
  },
  lecture: {
    findMany: vi.fn(),
  },
  enrollment: {
    update: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn((callback: (tx: typeof mockTx) => unknown) =>
      callback(mockTx),
    ),
    lecture: { findUnique: vi.fn() },
    enrollment: { findUnique: vi.fn() },
    progress: { findUnique: vi.fn() },
  },
}));

describe('PrismaLectureProgressRepository.upsertProgressInTransaction', () => {
  const repository = new PrismaLectureProgressRepository();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockTx.progress.findUnique).mockResolvedValue(null);
    vi.mocked(mockTx.progress.upsert).mockImplementation(async (args) => ({
      id: 'claaaaaaaaaaaaaaaaaaaaaa4',
      enrollmentId,
      lectureId,
      isCompleted: args.create?.isCompleted ?? args.update?.isCompleted ?? false,
      completedAt: args.create?.completedAt ?? args.update?.completedAt ?? null,
      lastAccessedAt:
        args.create?.lastAccessedAt ?? args.update?.lastAccessedAt ?? baseDate,
      timeSpent: args.create?.timeSpent ?? args.update?.timeSpent ?? 0,
      createdAt: baseDate,
      updatedAt: baseDate,
    }));
    vi.mocked(mockTx.lecture.findMany).mockResolvedValue([]);
    vi.mocked(mockTx.progress.count).mockResolvedValue(0);
    vi.mocked(mockTx.enrollment.update).mockResolvedValue({});
  });

  it('creates progress when none exists', async () => {
    await repository.upsertProgressInTransaction({
      enrollmentId,
      lectureId,
      courseId,
      isCompleted: false,
      incrementTime: 30,
      videoDuration: 300,
    });

    expect(mockTx.progress.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          timeSpent: 30,
          isCompleted: false,
        }),
      }),
    );
  });

  it('increments timeSpent on existing progress', async () => {
    vi.mocked(mockTx.progress.findUnique).mockResolvedValue({
      id: 'claaaaaaaaaaaaaaaaaaaaaa4',
      enrollmentId,
      lectureId,
      isCompleted: false,
      completedAt: null,
      lastAccessedAt: baseDate,
      timeSpent: 100,
      createdAt: baseDate,
      updatedAt: baseDate,
    });

    await repository.upsertProgressInTransaction({
      enrollmentId,
      lectureId,
      courseId,
      isCompleted: false,
      incrementTime: 30,
      videoDuration: 300,
    });

    expect(mockTx.progress.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          timeSpent: 130,
        }),
      }),
    );
  });

  it('caps increment at 110% of video duration', async () => {
    vi.mocked(mockTx.progress.findUnique).mockResolvedValue({
      id: 'claaaaaaaaaaaaaaaaaaaaaa4',
      enrollmentId,
      lectureId,
      isCompleted: false,
      completedAt: null,
      lastAccessedAt: baseDate,
      timeSpent: 320,
      createdAt: baseDate,
      updatedAt: baseDate,
    });

    await repository.upsertProgressInTransaction({
      enrollmentId,
      lectureId,
      courseId,
      isCompleted: false,
      incrementTime: 30,
      videoDuration: 300,
    });

    expect(mockTx.progress.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          timeSpent: 330,
        }),
      }),
    );
  });

  it('throws 409 when progress is already completed inside transaction', async () => {
    vi.mocked(mockTx.progress.findUnique).mockResolvedValue({
      id: 'claaaaaaaaaaaaaaaaaaaaaa4',
      enrollmentId,
      lectureId,
      isCompleted: true,
      completedAt: baseDate,
      lastAccessedAt: baseDate,
      timeSpent: 300,
      createdAt: baseDate,
      updatedAt: baseDate,
    });

    await expect(
      repository.upsertProgressInTransaction({
        enrollmentId,
        lectureId,
        courseId,
        isCompleted: false,
        incrementTime: 30,
        videoDuration: 300,
      }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('completes enrollment when all published lectures are done', async () => {
    const publishedLectureIds = [
      'claaaaaaaaaaaaaaaaaaaaaa5',
      'claaaaaaaaaaaaaaaaaaaaaa6',
    ];

    vi.mocked(mockTx.lecture.findMany).mockResolvedValue(
      publishedLectureIds.map((id) => ({ id })),
    );
    vi.mocked(mockTx.progress.count).mockResolvedValue(2);

    await repository.upsertProgressInTransaction({
      enrollmentId,
      lectureId,
      courseId,
      isCompleted: true,
      incrementTime: 0,
      videoDuration: 300,
    });

    expect(mockTx.enrollment.update).toHaveBeenCalledWith({
      where: { id: enrollmentId },
      data: {
        status: EnrollmentStatus.COMPLETED,
        completedAt: expect.any(Date),
      },
    });
  });

  it('does not complete enrollment when not all published lectures are done', async () => {
    vi.mocked(mockTx.lecture.findMany).mockResolvedValue([
      { id: 'claaaaaaaaaaaaaaaaaaaaaa5' },
      { id: 'claaaaaaaaaaaaaaaaaaaaaa6' },
    ]);
    vi.mocked(mockTx.progress.count).mockResolvedValue(1);

    await repository.upsertProgressInTransaction({
      enrollmentId,
      lectureId,
      courseId,
      isCompleted: true,
      incrementTime: 0,
      videoDuration: 300,
    });

    expect(mockTx.enrollment.update).not.toHaveBeenCalled();
  });
});
