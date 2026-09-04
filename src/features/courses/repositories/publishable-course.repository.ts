import { CourseStatus, CourseVisibility } from '@prisma/client';

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

export type LecturePublishRecord = {
  id: string;
  sectionId: string;
  isPublished: boolean;
  updatedAt: Date;
  course: {
    id: string;
    slug: string;
    status: CourseStatus;
    instructorId: string;
  };
};

export interface PublishableCourseRepository {
  findByIdOrSlug(courseIdOrSlug: string): Promise<CourseRecord | null>;
  publish(id: string): Promise<CourseRecord>;
}

export interface PublishableLectureRepository {
  findById(lectureId: string): Promise<LecturePublishRecord | null>;
  publish(lectureId: string): Promise<LecturePublishRecord>;
}

export class PrismaPublishableCourseRepository implements PublishableCourseRepository {
  async findByIdOrSlug(courseIdOrSlug: string): Promise<CourseRecord | null> {
    if (isCuid(courseIdOrSlug)) {
      return prisma.course.findUnique({
        where: { id: courseIdOrSlug },
        select: courseRecordSelect,
      });
    }

    return prisma.course.findUnique({
      where: { slug: courseIdOrSlug },
      select: courseRecordSelect,
    });
  }

  async publish(id: string): Promise<CourseRecord> {
    return prisma.course.update({
      where: { id },
      data: {
        status: CourseStatus.PUBLISHED,
        visibility: CourseVisibility.PUBLIC,
        publishedAt: new Date(),
      },
      select: courseRecordSelect,
    });
  }
}

export class PrismaPublishableLectureRepository implements PublishableLectureRepository {
  async findById(lectureId: string): Promise<LecturePublishRecord | null> {
    return prisma.lecture
      .findUnique({
        where: { id: lectureId },
        select: {
          id: true,
          sectionId: true,
          isPublished: true,
          updatedAt: true,
          section: {
            select: {
              course: {
                select: {
                  id: true,
                  slug: true,
                  status: true,
                  instructorId: true,
                },
              },
            },
          },
        },
      })
      .then((lecture) => {
        if (!lecture) {
          return null;
        }

        return {
          id: lecture.id,
          sectionId: lecture.sectionId,
          isPublished: lecture.isPublished,
          updatedAt: lecture.updatedAt,
          course: lecture.section.course,
        };
      });
  }

  async publish(lectureId: string): Promise<LecturePublishRecord> {
    const lecture = await prisma.lecture.update({
      where: { id: lectureId },
      data: { isPublished: true },
      select: {
        id: true,
        sectionId: true,
        isPublished: true,
        updatedAt: true,
        section: {
          select: {
            course: {
              select: {
                id: true,
                slug: true,
                status: true,
                instructorId: true,
              },
            },
          },
        },
      },
    });

    return {
      id: lecture.id,
      sectionId: lecture.sectionId,
      isPublished: lecture.isPublished,
      updatedAt: lecture.updatedAt,
      course: lecture.section.course,
    };
  }
}

export const publishableCourseRepository =
  new PrismaPublishableCourseRepository();
export const publishableLectureRepository =
  new PrismaPublishableLectureRepository();
