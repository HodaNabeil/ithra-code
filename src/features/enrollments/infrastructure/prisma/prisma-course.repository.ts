import { mapCourseDetailEntityToPublicDTO } from '@/features/courses/course-detail/mapper/to-api-dto';
import { courseDetailSelect } from '@/features/courses/course-detail/repository/course-detail.select';
import { prisma } from '@/lib/prisma';

import type { EnrollmentCourseDTO } from '../../application/dto/enrollment-list.dto';
import type { EnrollmentCourseRepository } from '../../application/ports/course.repository';

function omitRatingFields(
  course: ReturnType<typeof mapCourseDetailEntityToPublicDTO>,
): EnrollmentCourseDTO {
  const { rating: _rating, ratingCount: _ratingCount, ...rest } = course;
  return rest;
}

export class PrismaEnrollmentCourseRepository implements EnrollmentCourseRepository {
  async findByIds(courseIds: string[]): Promise<EnrollmentCourseDTO[]> {
    if (courseIds.length === 0) {
      return [];
    }

    const courses = await prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: courseDetailSelect,
    });

    return courses.map((course) =>
      omitRatingFields(mapCourseDetailEntityToPublicDTO(course)),
    );
  }
}

export const prismaEnrollmentCourseRepository =
  new PrismaEnrollmentCourseRepository();
