import type { LectureType } from '@prisma/client';

import { prisma } from '@/lib/prisma';

import type { CreateLectureOutputDTO } from '../dto/create-lecture.dto';

export type SectionWithCourse = {
  sectionId: string;
  courseId: string;
  courseSlug: string;
  instructorId: string;
};

export type CreateLectureData = {
  sectionId: string;
  title: string;
  description: string | null;
  type: LectureType;
};

export interface CreateLectureRepository {
  findSectionWithCourse(sectionId: string): Promise<SectionWithCourse | null>;
  createLecture(data: CreateLectureData): Promise<CreateLectureOutputDTO>;
}

function computeNextPosition(maxPosition: number | null): number {
  return maxPosition === null ? 0 : maxPosition + 1;
}

export class PrismaCreateLectureRepository implements CreateLectureRepository {
  async findSectionWithCourse(
    sectionId: string,
  ): Promise<SectionWithCourse | null> {
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      select: {
        id: true,
        course: {
          select: {
            id: true,
            slug: true,
            instructorId: true,
          },
        },
      },
    });

    if (!section?.course) {
      return null;
    }

    return {
      sectionId: section.id,
      courseId: section.course.id,
      courseSlug: section.course.slug,
      instructorId: section.course.instructorId,
    };
  }

  async createLecture(data: CreateLectureData): Promise<CreateLectureOutputDTO> {
    return prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT id FROM sections WHERE id = ${data.sectionId} FOR UPDATE`;

      const result = await tx.lecture.aggregate({
        where: { sectionId: data.sectionId },
        _max: { position: true },
      });

      const position = computeNextPosition(result._max.position);

      const lecture = await tx.lecture.create({
        data: {
          sectionId: data.sectionId,
          title: data.title,
          description: data.description,
          type: data.type,
          position,
          content: null,
          videoId: null,
          isPublished: false,
          isFree: false,
        },
        select: {
          id: true,
          sectionId: true,
          title: true,
          description: true,
          type: true,
          content: true,
          videoId: true,
          position: true,
          isPublished: true,
          isFree: true,
        },
      });

      return lecture;
    });
  }
}

export const createLectureRepository = new PrismaCreateLectureRepository();
