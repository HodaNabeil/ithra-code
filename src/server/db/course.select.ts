import { Prisma } from '@prisma/client';

export const courseListSelect = Prisma.validator<Prisma.CourseSelect>()({
  id: true,
  title: true,
  slug: true,
  description: true,
  thumbnailUrl: true,
  price: true,
  compareAtPrice: true,
  currency: true,
  duration: true,
  level: true,
  objectives: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
  reviews: {
    select: {
      rating: true,
    },
  },
  sections: {
    orderBy: { position: 'asc' },
    select: {
      lectures: {
        orderBy: { position: 'asc' },
        select: {
          id: true,
          videoDuration: true,
        },
      },
    },
  },
});

export type DB_CourseListItem = Prisma.CourseGetPayload<{
  select: typeof courseListSelect;
}>;

// ── Detail Select — Full payload for detail page ────────────────────
export const courseDetailSelect = Prisma.validator<Prisma.CourseSelect>()({
  id: true,
  title: true,
  slug: true,
  thumbnailUrl: true,
  price: true,
  compareAtPrice: true,
  currency: true,
  description: true,
  objectives: true,
  requirements: true,
  targetAudience: true,
  tags: true,
  duration: true,
  level: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
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

export type DB_CourseDetailItem = Prisma.CourseGetPayload<{
  select: typeof courseDetailSelect;
}>;
