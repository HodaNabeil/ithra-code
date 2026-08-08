import type { CourseStatus, CourseVisibility } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { CourseDraftEntity } from '../domain/course-draft.entity';

export type CreatedCourseRecord = {
  id: string;
  slug: string;
  status: CourseStatus;
  visibility: CourseVisibility;
  title: string;
  price: number;
};

export interface CourseCreationRepository {
  isSlugTaken(slug: string): Promise<boolean>;
  pathExists(pathId: string): Promise<boolean>;
  trackBelongsToPath(trackId: string, pathId: string): Promise<boolean>;
  create(entity: CourseDraftEntity): Promise<CreatedCourseRecord>;
}

export class PrismaCourseDraftRepository implements CourseCreationRepository {
  async isSlugTaken(slug: string): Promise<boolean> {
    const existing = await prisma.course.findUnique({
      where: { slug },
      select: { id: true },
    });

    return existing !== null;
  }

  async pathExists(pathId: string): Promise<boolean> {
    const path = await prisma.path.findUnique({
      where: { id: pathId },
      select: { id: true },
    });

    return path !== null;
  }

  async trackBelongsToPath(
    trackId: string,
    pathId: string,
  ): Promise<boolean> {
    const track = await prisma.track.findFirst({
      where: { id: trackId, pathId },
      select: { id: true },
    });

    return track !== null;
  }

  async create(entity: CourseDraftEntity): Promise<CreatedCourseRecord> {
    const course = await prisma.course.create({
      data: {
        slug: entity.slug,
        instructorId: entity.instructorId,
        pathId: entity.pathId,
        trackId: entity.trackId,
        title: entity.title,
        description: entity.description,
        thumbnailUrl: entity.thumbnailUrl,
        price: entity.price,
        status: entity.status,
        visibility: entity.visibility,
      },
      select: {
        id: true,
        slug: true,
        status: true,
        visibility: true,
        title: true,
        price: true,
      },
    });

    return {
      id: course.id,
      slug: course.slug,
      status: course.status,
      visibility: course.visibility,
      title: course.title,
      price: Number(course.price),
    };
  }
}

export const courseCreationRepository = new PrismaCourseDraftRepository();
