import { Prisma } from '@prisma/client';

export const pathDetailSelect = Prisma.validator<Prisma.PathSelect>()({
  id: true,
  title: true,
  slug: true,
  tagline: true,
  shortDescription: true,
  description: true,
  thumbnailUrl: true,
  category: true,
  icon: true,
  isPublished: true,
  sortOrder: true,
  metaTitle: true,
  metaDescription: true,
  createdAt: true,
  updatedAt: true,
  tracks: {
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      title: true,
      slug: true,
      shortDescription: true,
      thumbnailUrl: true,
      category: true,
      icon: true,
      isPublished: true,
      courses: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnailUrl: true,
          price: true,
          level: true,
          duration: true,
          status: true,
          visibility: true,
        },
      },
    },
  },
  pathSections: {
    select: {
      id: true,
      type: true,
      content: true,
      order: true,
    },
    orderBy: {
      order: 'asc',
    },
  },
});

export type DB_PathDetailEntity = Prisma.PathGetPayload<{
  select: typeof pathDetailSelect;
}>;
