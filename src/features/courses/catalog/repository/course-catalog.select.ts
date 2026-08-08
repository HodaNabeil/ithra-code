import { Prisma } from '@prisma/client';

export const courseCatalogSelect = Prisma.validator<Prisma.CourseSelect>()({
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
  status: true,
  visibility: true,
  instructorId: true,
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
          video: {
            select: {
              duration: true,
            },
          },
        },
      },
    },
  },
});

export type DB_CourseCatalogItem = Prisma.CourseGetPayload<{
  select: typeof courseCatalogSelect;
}>;
