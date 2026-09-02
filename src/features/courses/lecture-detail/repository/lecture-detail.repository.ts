import { EnrollmentStatus } from '@prisma/client';

import { prisma } from '@/lib/prisma';

import type {
  CourseRatingAggregate,
  LectureDetailEnrollment,
} from '../dto/lecture-detail.dto';
import {
  lectureDetailSelect,
  type DB_LectureDetailEntity,
} from './lecture-detail.select';

export interface LectureDetailRepository {
  findLectureById(lectureId: string): Promise<DB_LectureDetailEntity | null>;
  findValidEnrollment(
    studentId: string,
    courseId: string,
  ): Promise<LectureDetailEnrollment | null>;
  hasUserReviewedCourse(courseId: string, userId: string): Promise<boolean>;
  getCourseRatingAggregate(courseId: string): Promise<CourseRatingAggregate>;
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

  async findValidEnrollment(
    studentId: string,
    courseId: string,
  ): Promise<LectureDetailEnrollment | null> {
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId,
        courseId,
        status: {
          in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED],
        },
      },
      select: { id: true },
    });

    if (!enrollment) return null;

    return { id: enrollment.id };
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

  async getCourseRatingAggregate(
    courseId: string,
  ): Promise<CourseRatingAggregate> {
    const aggregate = await prisma.review.aggregate({
      where: { courseId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      rating: aggregate._avg.rating ?? 0,
      ratingCount: aggregate._count.rating,
    };
  }
}

export function isEnrollmentEligibleForAccess(
  enrollment: LectureDetailEnrollment | null,
): enrollment is LectureDetailEnrollment {
  return enrollment !== null;
}

export const lectureDetailRepository = new PrismaLectureDetailRepository();
