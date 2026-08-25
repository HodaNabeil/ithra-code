import { prisma } from '@/lib/prisma';
import { isCuid } from '@/features/courses/lib/is-cuid';
import { findUserCourseSignals } from '@/features/courses/services/user-course-signals.service';
import type { UserCourseSignals } from '../dto/course-detail.dto';
import {
  courseDetailSelect,
  type DB_CourseDetailEntity,
} from './course-detail.select';

export interface CourseDetailRepository {
  findCourseBySlug(slug: string): Promise<DB_CourseDetailEntity | null>;
  findCourseByIdOrSlug(idOrSlug: string): Promise<DB_CourseDetailEntity | null>;
  findUserSignals(userId: string, courseId: string): Promise<UserCourseSignals>;
}

export class PrismaCourseDetailRepository implements CourseDetailRepository {
  async findCourseBySlug(slug: string): Promise<DB_CourseDetailEntity | null> {
    return prisma.course.findUnique({
      where: { slug },
      select: courseDetailSelect,
    });
  }

  async findCourseByIdOrSlug(
    idOrSlug: string,
  ): Promise<DB_CourseDetailEntity | null> {
    if (isCuid(idOrSlug)) {
      return prisma.course.findUnique({
        where: { id: idOrSlug },
        select: courseDetailSelect,
      });
    }

    return this.findCourseBySlug(idOrSlug);
  }

  async findUserSignals(
    userId: string,
    courseId: string,
  ): Promise<UserCourseSignals> {
    return findUserCourseSignals(userId, courseId);
  }
}

export const courseDetailRepository = new PrismaCourseDetailRepository();
