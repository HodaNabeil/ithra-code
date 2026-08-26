import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { PathListQuery } from '../dto/path-list.dto';
import { pathListSelect, type DB_PathListItem } from './path-list.select';

export type FindManyWithCountInput = {
  where: Prisma.PathWhereInput;
  query: PathListQuery;
};

export type FindManyWithCountResult = {
  items: DB_PathListItem[];
  total: number;
};

export interface PathListRepository {
  findManyWithCount(
    input: FindManyWithCountInput,
  ): Promise<FindManyWithCountResult>;
}

function buildFilterWhere(query: PathListQuery): Prisma.PathWhereInput {
  const { search, category } = query;
  const queryMode: Prisma.QueryMode = 'insensitive';

  return {
    ...(search && {
      OR: [
        { title: { contains: search, mode: queryMode } },
        { description: { contains: search, mode: queryMode } },
        { tagline: { contains: search, mode: queryMode } },
      ],
    }),
    ...(category && { category }),
  };
}

function buildOrderBy(
  sort: PathListQuery['sort'],
): Prisma.PathOrderByWithRelationInput {
  if (sort === 'oldest') {
    return { createdAt: 'asc' };
  }
  if (sort === 'title') {
    return { title: 'asc' };
  }
  return { createdAt: 'desc' };
}

export class PrismaPathListRepository implements PathListRepository {
  async findManyWithCount(
    input: FindManyWithCountInput,
  ): Promise<FindManyWithCountResult> {
    const { where: visibilityWhere, query } = input;
    const { page, limit, sort = 'newest' } = query;

    const where: Prisma.PathWhereInput = {
      AND: [visibilityWhere, buildFilterWhere(query)],
    };

    const [items, total] = await Promise.all([
      prisma.path.findMany({
        where,
        orderBy: buildOrderBy(sort),
        skip: (page - 1) * limit,
        take: limit,
        select: pathListSelect,
      }),
      prisma.path.count({ where }),
    ]);

    return { items, total };
  }
}

export const pathListRepository = new PrismaPathListRepository();
