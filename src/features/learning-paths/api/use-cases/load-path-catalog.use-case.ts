import { auth } from '@/lib/auth';
import type { PathListDTO } from '@/types/path/path.dto';
import type {
  GetPublicPathsParams,
  GetPublicPathsResult,
} from '@/types/path/path.types';
import type { PathCatalogQuery, PathViewer } from '../dto/path-catalog.dto';
import { PATHS_PAGE_LIMIT } from '../lib/path-catalog-query';
import { mapCatalogResultToGetPublicPathsResult } from '../mapper/to-list-dto';
import { getPathCatalog } from './get-path-catalog.use-case';

export const PATHS_FILTER_LIMIT = 50;

async function resolveViewer(): Promise<PathViewer> {
  try {
    const session = await auth();
    if (!session?.user?.id) return null;
    return { id: session.user.id, role: session.user.role };
  } catch {
    return null;
  }
}

function toPathCatalogQuery(
  params: GetPublicPathsParams = {},
): PathCatalogQuery {
  return {
    page: params.page ?? 1,
    limit: params.limit ?? PATHS_PAGE_LIMIT,
    search: params.search,
    sort: params.sort ?? 'newest',
    category: params.category,
  };
}

/** SSR / server-side path catalog loader with RBAC visibility. */
export async function getPaths(
  params: GetPublicPathsParams = {},
): Promise<GetPublicPathsResult> {
  const viewer = await resolveViewer();
  const result = await getPathCatalog({
    query: toPathCatalogQuery(params),
    viewer,
  });

  return mapCatalogResultToGetPublicPathsResult(result);
}

/** Lightweight helper for course filter dropdowns (all published paths). */
export async function getPathsForFilters(): Promise<PathListDTO[]> {
  const { paths } = await getPaths({ page: 1, limit: PATHS_FILTER_LIMIT });
  return paths;
}
