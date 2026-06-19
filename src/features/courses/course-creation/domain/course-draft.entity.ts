import { CourseStatus, CourseVisibility } from '@prisma/client';

export type CourseDraftEntity = {
  slug: string;
  instructorId: string;
  pathId: string;
  trackId?: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  price: number;
  status: typeof CourseStatus.DRAFT;
  visibility: typeof CourseVisibility.PRIVATE;
};

export type CreateCourseDraftInput = {
  slug: string;
  pathId: string;
  trackId?: string;
  instructorId: string;
};

export function createCourseDraftEntity(
  input: CreateCourseDraftInput,
): CourseDraftEntity {
  return {
    slug: input.slug,
    instructorId: input.instructorId,
    pathId: input.pathId,
    trackId: input.trackId,
    title: '',
    description: '',
    thumbnailUrl: '',
    price: 0,
    status: CourseStatus.DRAFT,
    visibility: CourseVisibility.PRIVATE,
  };
}
