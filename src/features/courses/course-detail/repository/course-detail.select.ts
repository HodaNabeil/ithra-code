import { Prisma } from '@prisma/client';

/** Single source of truth for course detail queries (API + SSR page). */
export const courseDetailSelect = Prisma.validator<Prisma.CourseSelect>()({
  id: true,
  instructorId: true,
  title: true,
  slug: true,
  description: true,
  shortDescription: true,
  thumbnailUrl: true,
  previewVideo: true,
  price: true,
  compareAtPrice: true,
  currency: true,
  level: true,
  status: true,
  visibility: true,
  duration: true,
  objectives: true,
  requirements: true,
  targetAudience: true,
  tags: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
  instructor: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profilePicture: true,
    },
  },
  reviews: {
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profilePicture: true,
        },
      },
    },
  },
  _count: {
    select: {
      enrollments: true,
    },
  },
  sections: {
    orderBy: { position: 'asc' },
    select: {
      id: true,
      title: true,
      description: true,
      position: true,
      lectures: {
        orderBy: { position: 'asc' },
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          videoDuration: true,
          muxPlaybackId: true,
          position: true,
          isFree: true,
          attachments: {
            orderBy: { position: 'asc' },
            select: {
              id: true,
              name: true,
              description: true,
              type: true,
              url: true,
              fileSize: true,
              mimeType: true,
              isDownloadable: true,
              position: true,
            },
          },
        },
      },
    },
  },
  prerequisites: {
    select: {
      id: true,
      title: true,
      slug: true,
      thumbnailUrl: true,
      price: true,
      currency: true,
      duration: true,
      description: true,
    },
  },
});

export type DB_CourseDetailEntity = Prisma.CourseGetPayload<{
  select: typeof courseDetailSelect;
}>;

/** @deprecated Use `courseDetailSelect` */
export const courseDetailApiSelect = courseDetailSelect;
