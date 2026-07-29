import { prisma } from '@/lib/prisma';

import type {
  CourseContentRepositoryPort,
  CourseForIndexingDTO,
} from '../../domain/ports/CourseContentRepositoryPort';

export class PrismaCourseContentRepository implements CourseContentRepositoryPort {
  async findPublishedCourseForIndexing(
    courseSlug: string,
  ): Promise<CourseForIndexingDTO | null> {
    return prisma.course.findFirst({
      where: { slug: courseSlug },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        shortDescription: true,
        objectives: true,
        status: true,
        instructorId: true,
        sections: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            title: true,
            lectures: {
              where: { isPublished: true },
              orderBy: { position: 'asc' },
              select: {
                id: true,
                title: true,
                description: true,
                content: true,
                type: true,
                attachments: {
                  orderBy: { position: 'asc' },
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    content: true,
                    type: true,
                    url: true,
                    mimeType: true,
                  },
                },
                transcript: {
                  select: {
                    id: true,
                    content: true,
                    source: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}

export const prismaCourseContentRepository = new PrismaCourseContentRepository();
