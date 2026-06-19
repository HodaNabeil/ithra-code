import { EnrollmentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { isCuid } from '@/features/courses/lib/is-cuid';
import type {
  CourseOverviewAggregates,
  CourseOverviewIdentity,
} from '../dto/course-overview.dto';
import {
  courseOverviewIdentitySelect,
  type DB_CourseOverviewIdentity,
} from './course-overview.select';

export interface CourseOverviewRepository {
  findCourseIdentity(idOrSlug: string): Promise<CourseOverviewIdentity | null>;
  getAggregates(
    courseId: string,
    options: { publishedLecturesOnly: boolean },
  ): Promise<CourseOverviewAggregates>;
}

function mapIdentity(entity: DB_CourseOverviewIdentity): CourseOverviewIdentity {
  return {
    id: entity.id,
    slug: entity.slug,
    instructorId: entity.instructorId,
    description: entity.description,
    level: entity.level,
    updatedAt: entity.updatedAt,
    status: entity.status,
    visibility: entity.visibility,
  };
}

export class PrismaCourseOverviewRepository implements CourseOverviewRepository {
  async findCourseIdentity(idOrSlug: string): Promise<CourseOverviewIdentity | null> {
    const where = isCuid(idOrSlug) ? { id: idOrSlug } : { slug: idOrSlug };

    const entity = await prisma.course.findUnique({
      where,
      select: courseOverviewIdentitySelect,
    });

    return entity ? mapIdentity(entity) : null;
  }

  async getAggregates(
    courseId: string,
    options: { publishedLecturesOnly: boolean },
  ): Promise<CourseOverviewAggregates> {
    const lectureWhere = {
      section: { courseId },
      ...(options.publishedLecturesOnly ? { isPublished: true } : {}),
    };

    const [
      videoDurationAggregate,
      totalStudents,
      reviewAggregate,
      lecturesCount,
    ] = await Promise.all([
      prisma.lecture.aggregate({
        where: {
          section: { courseId },
          videoDuration: { not: null },
          ...(options.publishedLecturesOnly ? { isPublished: true } : {}),
        },
        _sum: { videoDuration: true },
      }),
      prisma.enrollment.count({
        where: {
          courseId,
          status: EnrollmentStatus.ACTIVE,
        },
      }),
      prisma.review.aggregate({
        where: { courseId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      prisma.lecture.count({
        where: lectureWhere,
      }),
    ]);

    return {
      totalVideoDurationSeconds: videoDurationAggregate._sum.videoDuration ?? 0,
      totalStudents,
      averageRating: reviewAggregate._avg.rating,
      ratingsCount: reviewAggregate._count.rating,
      lecturesCount,
    };
  }
}

export const courseOverviewRepository = new PrismaCourseOverviewRepository();
