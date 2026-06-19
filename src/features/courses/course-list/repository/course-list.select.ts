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
