import { prisma } from '@/lib/prisma';
import { findUserCourseSignals } from '@/features/courses/services/user-course-signals.service';
import type { UserCourseSignals } from '../dto/course-detail.dto';
import {
  courseDetailSelect,
  type DB_CourseDetailEntity,
} from './course-detail.select';

export interface CourseDetailRepository {
  findCourseBySlug(slug: string): Promise<DB_CourseDetailEntity | null>;
  findUserSignals(
    userId: string,
    courseId: string,
  ): Promise<UserCourseSignals>;
}

export class PrismaCourseDetailRepository implements CourseDetailRepository {
  async findCourseBySlug(slug: string): Promise<DB_CourseDetailEntity | null> {
    return prisma.course.findUnique({
      where: { slug },
      select: courseDetailSelect,
    });
  }

  async findUserSignals(
    userId: string,
    courseId: string,
  ): Promise<UserCourseSignals> {
    return findUserCourseSignals(userId, courseId);
  }
}

export const courseDetailRepository = new PrismaCourseDetailRepository();
