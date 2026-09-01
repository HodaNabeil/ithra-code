import { EnrollmentStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { COURSE_ORDER_BY } from '@/constants/course';
import type { CourseListQuery } from '../dto/course-list.dto';
import {
  courseListSelect,
  type DB_CourseListItem,
} from './course-list.select';

export type FindManyWithCountInput = {
  where: Prisma.CourseWhereInput;
  query: CourseListQuery;
};

export type FindManyWithCountResult = {
  items: DB_CourseListItem[];
  total: number;
};

export interface CourseListRepository {
  findManyWithCount(
    input: FindManyWithCountInput,
  ): Promise<FindManyWithCountResult>;
  findUserCartCourseIds(userId: string): Promise<Set<string>>;
  findUserEnrolledCourseIds(userId: string): Promise<Set<string>>;
}

function buildFilterWhere(query: CourseListQuery): Prisma.CourseWhereInput {
  const { search, path, level, featured } = query;

  return {
    ...(search && {
      title: {
        contains: search,
        mode: 'insensitive' as const,
      },
    }),
    ...(path && {
      path: { slug: path },
    }),
    ...(level && { level }),
    ...(featured && { isFeatured: true }),
  };
}

export class PrismaCourseListRepository implements CourseListRepository {
  async findManyWithCount(
    input: FindManyWithCountInput,
  ): Promise<FindManyWithCountResult> {
    const { where: visibilityWhere, query } = input;
    const { page, limit, sort = 'newest' } = query;

    const where: Prisma.CourseWhereInput = {
      AND: [visibilityWhere, buildFilterWhere(query)],
    };

    const orderBy = COURSE_ORDER_BY[sort];

    const [items, total] = await Promise.all([
      prisma.course.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: courseListSelect,
      }),
      prisma.course.count({ where }),
    ]);

    return { items, total };
  }

  async findUserCartCourseIds(userId: string): Promise<Set<string>> {
    const cartItems = await prisma.cartItem.findMany({
      where: {
        cart: { userId },
      },
      select: { courseId: true },
    });

    return new Set(cartItems.map((item) => item.courseId));
  }

  async findUserEnrolledCourseIds(userId: string): Promise<Set<string>> {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: userId,
        status: EnrollmentStatus.ACTIVE,
      },
      select: { courseId: true },
    });

    return new Set(enrollments.map((enrollment) => enrollment.courseId));
  }
}

export const courseListRepository = new PrismaCourseListRepository();
