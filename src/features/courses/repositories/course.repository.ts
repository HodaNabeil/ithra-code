import { CourseStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { isCuid } from '../lib/is-cuid';
import type { CourseRecord } from '../types/course-record.types';

const courseRecordSelect = {
  id: true,
  slug: true,
  title: true,
  status: true,
  instructorId: true,
  createdAt: true,
  updatedAt: true,
} as const;

export interface CourseRepository {
  findById(id: string): Promise<CourseRecord | null>;
  findBySlug(slug: string): Promise<CourseRecord | null>;
  findByIdOrSlug(courseIdOrSlug: string): Promise<CourseRecord | null>;
  archive(id: string): Promise<CourseRecord>;
}

export class PrismaCourseRepository implements CourseRepository {
  async findById(id: string): Promise<CourseRecord | null> {
    return prisma.course.findUnique({
      where: { id },
      select: courseRecordSelect,
    });
  }

  async findBySlug(slug: string): Promise<CourseRecord | null> {
    return prisma.course.findUnique({
      where: { slug },
      select: courseRecordSelect,
    });
  }

  async findByIdOrSlug(courseIdOrSlug: string): Promise<CourseRecord | null> {
    if (isCuid(courseIdOrSlug)) {
      return this.findById(courseIdOrSlug);
    }

    return this.findBySlug(courseIdOrSlug);
  }

  async archive(id: string): Promise<CourseRecord> {
    return prisma.course.update({
      where: { id },
      data: {
        status: CourseStatus.ARCHIVED,
      },
      select: courseRecordSelect,
    });
  }
}

export const courseRepository = new PrismaCourseRepository();
