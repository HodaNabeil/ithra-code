import { auth } from '@/lib/auth';
import type { PathListDTO } from '@/types/path/path.dto';
import type {
  GetPublicPathsParams,
  GetPublicPathsResult,
} from '@/types/path/path.types';
import type { PathListQuery, PathViewer } from '../dto/path-list.dto';
import { PATHS_PAGE_LIMIT } from '../lib/path-list-query';
import { mapPathListResultToGetPublicPathsResult } from '../mapper/to-list-dto';
import { listPaths } from './list-paths.use-case';

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

function toPathListQuery(params: GetPublicPathsParams = {}): PathListQuery {
  return {
    page: params.page ?? 1,
    limit: params.limit ?? PATHS_PAGE_LIMIT,
    search: params.search,
    sort: params.sort ?? 'newest',
    category: params.category,
  };
}

/** SSR / server-side path loader with RBAC visibility. */
export async function getPaths(
  params: GetPublicPathsParams = {},
): Promise<GetPublicPathsResult> {
  const viewer = await resolveViewer();
  const result = await listPaths({
    query: toPathListQuery(params),
    viewer,
  });

  return mapPathListResultToGetPublicPathsResult(result);
}

/** Lightweight helper for course filter dropdowns (all published paths). */
export async function getPathsForFilters(): Promise<PathListDTO[]> {
  const { paths } = await getPaths({ page: 1, limit: PATHS_FILTER_LIMIT });
  return paths;
}
