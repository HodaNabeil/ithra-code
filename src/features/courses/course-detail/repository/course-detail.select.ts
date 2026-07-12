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
  isFeatured: true,
  duration: true,
  requirements: true,
  objectives: true,
  targetAudience: true,
  tags: true,
  metaTitle: true,
  metaDescription: true,
  certificateEnabled: true,
  maxStudents: true,
  pathId: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
  instructor: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      image: true,
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
          image: true,
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
      courseId: true,
      title: true,
      description: true,
      position: true,
      isPublished: true,
      createdAt: true,
      updatedAt: true,
      lectures: {
        orderBy: { position: 'asc' },
        select: {
          id: true,
          sectionId: true,
          title: true,
          description: true,
          type: true,
          video: {
            select: {
              duration: true,
              bunnyVideoId: true,
            },
          },
          position: true,
          isPublished: true,
          isFree: true,
          createdAt: true,
          updatedAt: true,
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
              createdAt: true,
              updatedAt: true,
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
      level: true,
      duration: true,
      description: true,
      reviews: {
        select: {
          rating: true,
        },
      },
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
  },
});

export type DB_CourseDetailEntity = Prisma.CourseGetPayload<{
  select: typeof courseDetailSelect;
}>;

/** @deprecated Use `courseDetailSelect` */
export const courseDetailApiSelect = courseDetailSelect;
