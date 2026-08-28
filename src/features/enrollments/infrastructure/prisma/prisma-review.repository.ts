import { prisma } from '@/lib/prisma';

import type { EnrollmentReviewDTO } from '../../application/dto/enrollment-list.dto';
import type { EnrollmentReviewRepository } from '../../application/ports/review.repository';

function toIso(value: Date): string {
  return value.toISOString();
}

export class PrismaEnrollmentReviewRepository implements EnrollmentReviewRepository {
  async findByUserAndCourseIds(
    userId: string,
    courseIds: string[],
  ): Promise<EnrollmentReviewDTO[]> {
    if (courseIds.length === 0) {
      return [];
    }

    const reviews = await prisma.review.findMany({
      where: {
        userId,
        courseId: { in: courseIds },
      },
      select: {
        id: true,
        courseId: true,
        userId: true,
        rating: true,
        comment: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return reviews.map((review) => ({
      id: review.id,
      courseId: review.courseId,
      userId: review.userId,
      rating: review.rating,
      comment: review.comment,
      createdAt: toIso(review.createdAt),
      updatedAt: toIso(review.updatedAt),
    }));
  }
}

export const prismaEnrollmentReviewRepository =
  new PrismaEnrollmentReviewRepository();
