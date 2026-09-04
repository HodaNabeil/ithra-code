import { EnrollmentStatus } from '@prisma/client';

import { prisma } from '@/lib/prisma';

import { computeActualIncrement } from '../lib/compute-actual-increment';
import {
  LectureProgressError,
  progressAlreadyCompletedMessage,
} from '../errors/lecture-progress.errors';

export type LectureContext = {
  id: string;
  courseId: string;
  videoDuration: number | null;
  sectionIsPublished: boolean;
  lectureIsPublished: boolean;
};

export type LectureProgressEnrollment = {
  id: string;
  status: EnrollmentStatus;
};

export type LectureProgressRecord = {
  id: string;
  enrollmentId: string;
  lectureId: string;
  isCompleted: boolean;
  completedAt: Date | null;
  lastAccessedAt: Date;
  timeSpent: number;
  createdAt: Date;
  updatedAt: Date;
};

export type UpsertProgressInput = {
  enrollmentId: string;
  lectureId: string;
  courseId: string;
  isCompleted: boolean;
  incrementTime: number;
  videoDuration: number | null;
};

export interface LectureProgressRepository {
  findLectureContext(lectureId: string): Promise<LectureContext | null>;
  findEnrollment(
    studentId: string,
    courseId: string,
  ): Promise<LectureProgressEnrollment | null>;
  findProgress(
    enrollmentId: string,
    lectureId: string,
  ): Promise<LectureProgressRecord | null>;
  upsertProgressInTransaction(
    input: UpsertProgressInput,
  ): Promise<LectureProgressRecord>;
}

export class PrismaLectureProgressRepository implements LectureProgressRepository {
  async findLectureContext(lectureId: string): Promise<LectureContext | null> {
    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
      select: {
        id: true,
        isPublished: true,
        section: {
          select: {
            courseId: true,
            isPublished: true,
          },
        },
        video: {
          select: {
            duration: true,
          },
        },
      },
    });

    if (!lecture?.section) return null;

    return {
      id: lecture.id,
      courseId: lecture.section.courseId,
      videoDuration: lecture.video?.duration ?? null,
      sectionIsPublished: lecture.section.isPublished,
      lectureIsPublished: lecture.isPublished,
    };
  }

  async findEnrollment(
    studentId: string,
    courseId: string,
  ): Promise<LectureProgressEnrollment | null> {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId, courseId },
      },
      select: { id: true, status: true },
    });

    if (!enrollment) return null;

    return {
      id: enrollment.id,
      status: enrollment.status,
    };
  }

  async findProgress(
    enrollmentId: string,
    lectureId: string,
  ): Promise<LectureProgressRecord | null> {
    return prisma.progress.findUnique({
      where: {
        enrollmentId_lectureId: { enrollmentId, lectureId },
      },
    });
  }

  async upsertProgressInTransaction(
    input: UpsertProgressInput,
  ): Promise<LectureProgressRecord> {
    const {
      enrollmentId,
      lectureId,
      courseId,
      isCompleted,
      incrementTime,
      videoDuration,
    } = input;

    return prisma.$transaction(async (tx) => {
      const existing = await tx.progress.findUnique({
        where: {
          enrollmentId_lectureId: { enrollmentId, lectureId },
        },
      });

      if (existing?.isCompleted) {
        throw new LectureProgressError(
          409,
          progressAlreadyCompletedMessage(),
          'PROGRESS_ALREADY_COMPLETED',
        );
      }

      const actualIncrement = computeActualIncrement(
        incrementTime,
        existing?.timeSpent ?? 0,
        videoDuration,
      );
      const now = new Date();

      const progress = await tx.progress.upsert({
        where: {
          enrollmentId_lectureId: { enrollmentId, lectureId },
        },
        update: {
          timeSpent: (existing?.timeSpent ?? 0) + actualIncrement,
          isCompleted,
          completedAt: isCompleted ? now : (existing?.completedAt ?? null),
          lastAccessedAt: now,
        },
        create: {
          enrollmentId,
          lectureId,
          timeSpent: actualIncrement,
          isCompleted,
          completedAt: isCompleted ? now : null,
          lastAccessedAt: now,
        },
      });

      if (isCompleted) {
        const publishedLectures = await tx.lecture.findMany({
          where: {
            isPublished: true,
            section: { courseId, isPublished: true },
          },
          select: { id: true },
        });

        if (publishedLectures.length > 0) {
          const completedCount = await tx.progress.count({
            where: {
              enrollmentId,
              lectureId: { in: publishedLectures.map((l) => l.id) },
              isCompleted: true,
            },
          });

          if (completedCount === publishedLectures.length) {
            await tx.enrollment.update({
              where: { id: enrollmentId },
              data: {
                status: EnrollmentStatus.COMPLETED,
                completedAt: now,
              },
            });
          }
        }
      }

      return progress;
    });
  }
}

export const lectureProgressRepository = new PrismaLectureProgressRepository();
