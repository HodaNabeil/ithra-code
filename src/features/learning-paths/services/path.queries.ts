import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/cache';
import { Prisma } from '@prisma/client';
import { PATH_TAGS } from '@/lib/query-keys';
import { pathListSelect, pathDetailSelect } from '@/server/db/path.select';
import { mapPathListToDTO, mapPathDetailToDTO } from '@/mappers/path.mapper';
import {
  GetPublicPathsParams,
  GetPublicPathsResult,
  PathCategoryDTO,
  GetPathBySlugResult,
} from '@/types/path/path.types';

// ────────────────────────────────────────────────────────────────────
// Cached core functions
// ────────────────────────────────────────────────────────────────────

const getPublicPathsCached = cache(
  async (params: GetPublicPathsParams): Promise<GetPublicPathsResult> => {
    const { page = 1, limit = 9, search, category, sort } = params;
    const skip = (page - 1) * limit;
    const queryMode: Prisma.QueryMode = 'insensitive';

    const where: Prisma.PathWhereInput = {
      isPublished: true,
      ...(search && {
        OR: [
          { title: { contains: search, mode: queryMode } },
          { description: { contains: search, mode: queryMode } },
          { tagline: { contains: search, mode: queryMode } },
        ],
      }),
      ...(category && { category: category as PathCategoryDTO }),
    };

    const orderBy: Prisma.PathOrderByWithRelationInput = {};
    if (sort === 'oldest') {
      orderBy.createdAt = 'asc';
    } else if (sort === 'title') {
      orderBy.title = 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [paths, totalCount] = await Promise.all([
      prisma.path.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: pathListSelect,
      }),
      prisma.path.count({ where }),
    ]);

    return {
      paths: paths.map(mapPathListToDTO),
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    };
  },
  // Dynamic cache key factory
  (params) =>
    [...PATH_TAGS.path.list(params)].map((p) =>
      typeof p === 'string' ? p : JSON.stringify(p),
    ),
  {
    tags: [...PATH_TAGS.path.lists()],
    revalidate: 60,
  },
);

// ── Public API (legacy — prefer @/features/learning-paths/api for reads) ──
export const getPublicPaths = (params: GetPublicPathsParams = {}) =>
  getPublicPathsCached(params);

// ────────────────────────────────────────────────────────────────────

const getPathsBySlugCached = cache(
  async (slug: string): Promise<GetPathBySlugResult> => {
    const path = await prisma.path.findUnique({
      where: {
        slug,
        isPublished: true,
      },
      select: pathDetailSelect,
    });

    if (!path) {
      throw new Error('Path not found');
    }

    return {
      data: {
        path: mapPathDetailToDTO(path),
      },
    };
  },
  // Dynamic cache key factory
  (slug) => [...PATH_TAGS.path.detail(slug)],
  {
    tags: [...PATH_TAGS.path.details()],
    revalidate: 60,
  },
);

// ── Public API ──────────────────────────────────────────────────────
export const getPathsBySlug = (slug: string) => getPathsBySlugCached(slug);

// ────────────────────────────────────────────────────────────────────
// Get all paths for sitemap
// ────────────────────────────────────────────────────────────────────
// ── Public API ──────────────────────────────────────────────────────
const getAllPathsForSitemapCached = cache(
  async () => {
    return prisma.path.findMany({
      where: {
        isPublished: true,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    });
  },
  () => ['sitemap-paths'],
  {
    tags: [...PATH_TAGS.path.all()],
    revalidate: 3600,
  },
);

export const getAllPathsForSitemap = () => getAllPathsForSitemapCached();
