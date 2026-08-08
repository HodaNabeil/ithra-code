import type { PathCatalogQuery, PathCatalogResult, PathViewer } from '../dto/path-catalog.dto';
import {
  buildPathVisibilityWhere,
  filterPathForAudience,
} from '../policies/path-visibility.policy';
import { mapPathCatalogItemToDTO } from '../mapper/to-path-dto';
import {
  pathCatalogRepository,
  type PathCatalogRepository,
} from '../repository/path-catalog.repository';

export type GetPathCatalogInput = {
  query: PathCatalogQuery;
  viewer?: PathViewer;
};

/** API use-case: visibility filtering + pagination for path catalog. */
export async function getPathCatalog(
  input: GetPathCatalogInput,
  repository: PathCatalogRepository = pathCatalogRepository,
): Promise<PathCatalogResult> {
  const viewer = input.viewer ?? null;
  const visibilityWhere = buildPathVisibilityWhere(viewer);

  const { items: rows, total } = await repository.findManyWithCount({
    where: visibilityWhere,
    query: input.query,
  });

  const paths = rows
    .filter((path) => filterPathForAudience(path, viewer))
    .map((path) => mapPathCatalogItemToDTO(path, viewer));

  return {
    paths,
    pagination: {
      total,
      page: input.query.page,
      limit: input.query.limit,
      totalPages: Math.ceil(total / input.query.limit),
    },
  };
}
