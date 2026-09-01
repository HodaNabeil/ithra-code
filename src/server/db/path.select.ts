import { Prisma } from '@prisma/client';

export const pathListSelect = Prisma.validator<Prisma.PathSelect>()({
  id: true,
  title: true,
  slug: true,
  tagline: true,
  shortDescription: true,
  thumbnailUrl: true,
  category: true,
  icon: true,
  isPublished: true,
  createdAt: true,
  updatedAt: true,
  tracks: {
    select: {
      id: true,
      title: true,
    },
  },
});

export type DB_PathListItem = Prisma.PathGetPayload<{
  select: typeof pathListSelect;
}>;

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
      description: true,
      thumbnailUrl: true,
      category: true,
      icon: true,
      courses: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnailUrl: true,
          price: true,
          level: true,
          duration: true,
        },
      },
    },
  },
});

export type DB_PathDetailItem = Prisma.PathGetPayload<{
  select: typeof pathDetailSelect;
}>;
