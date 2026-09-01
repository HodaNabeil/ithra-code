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
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      title: true,
      isPublished: true,
    },
  },
});

export type DB_PathListItem = Prisma.PathGetPayload<{
  select: typeof pathListSelect;
}>;
