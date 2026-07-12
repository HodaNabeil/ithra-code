import { prisma } from '@/lib/prisma';
import type { CourseForPurchase } from '../../../domain/policies/course-purchase.policy';
import type { CourseRepository } from '../../../domain/repositories/course.repository';

export class PrismaCourseRepository implements CourseRepository {
  async findByIdForPurchase(
    courseId: string,
  ): Promise<CourseForPurchase | null> {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        price: true,
        currency: true,
        status: true,
        visibility: true,
      },
    });

    if (!course) return null;

    return {
      id: course.id,
      price: Number(course.price),
      currency: course.currency,
      status: course.status,
      visibility: course.visibility,
    };
  }
}

export const prismaCourseRepository = new PrismaCourseRepository();
