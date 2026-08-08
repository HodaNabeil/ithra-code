import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { PathCatalogQuery } from '../dto/path-catalog.dto';
import {
  pathCatalogSelect,
  type DB_PathCatalogItem,
} from './path-catalog.select';

export type FindManyWithCountInput = {
  where: Prisma.PathWhereInput;
  query: PathCatalogQuery;
};

export type FindManyWithCountResult = {
  items: DB_PathCatalogItem[];
  total: number;
};

export interface PathCatalogRepository {
  findManyWithCount(
    input: FindManyWithCountInput,
  ): Promise<FindManyWithCountResult>;
}

function buildFilterWhere(query: PathCatalogQuery): Prisma.PathWhereInput {
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
  sort: PathCatalogQuery['sort'],
): Prisma.PathOrderByWithRelationInput {
  if (sort === 'oldest') {
    return { createdAt: 'asc' };
  }
  if (sort === 'title') {
    return { title: 'asc' };
  }
  return { createdAt: 'desc' };
}

export class PrismaPathCatalogRepository implements PathCatalogRepository {
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
        select: pathCatalogSelect,
      }),
      prisma.path.count({ where }),
    ]);

    return { items, total };
  }
}

export const pathCatalogRepository = new PrismaPathCatalogRepository();
