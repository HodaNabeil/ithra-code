import { EnrollmentStatus } from '@prisma/client';

import { prisma } from '@/lib/prisma';

import type { LectureDetailEnrollment } from '../dto/lecture-detail.dto';
import {
  lectureDetailSelect,
  type DB_LectureDetailEntity,
} from './lecture-detail.select';

export interface LectureDetailRepository {
  findLectureById(lectureId: string): Promise<DB_LectureDetailEntity | null>;
  findEnrollment(
    studentId: string,
    courseId: string,
  ): Promise<LectureDetailEnrollment | null>;
  hasUserReviewedCourse(courseId: string, userId: string): Promise<boolean>;
}

export class PrismaLectureDetailRepository implements LectureDetailRepository {
  async findLectureById(
    lectureId: string,
  ): Promise<DB_LectureDetailEntity | null> {
    return prisma.lecture.findUnique({
      where: { id: lectureId },
      select: lectureDetailSelect,
    });
  }

  async findEnrollment(
    studentId: string,
    courseId: string,
  ): Promise<LectureDetailEnrollment | null> {
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

  async hasUserReviewedCourse(
    courseId: string,
    userId: string,
  ): Promise<boolean> {
    const review = await prisma.review.findUnique({
      where: {
        courseId_userId: { courseId, userId },
      },
      select: { id: true },
    });

    return review !== null;
  }
}

export function isEnrollmentEligibleForAccess(
  enrollment: LectureDetailEnrollment,
): boolean {
  return (
    enrollment.status === EnrollmentStatus.ACTIVE ||
    enrollment.status === EnrollmentStatus.COMPLETED
  );
}

export const lectureDetailRepository = new PrismaLectureDetailRepository();
