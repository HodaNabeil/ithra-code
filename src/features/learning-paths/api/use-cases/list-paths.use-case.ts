import type {
  PathListQuery,
  PathListResult,
  PathViewer,
} from '../dto/path-list.dto';
import {
  buildPathVisibilityWhere,
  filterPathForAudience,
} from '../policies/path-visibility.policy';
import { mapPathListItemToDTO } from '../mapper/to-path-dto';
import {
  pathListRepository,
  type PathListRepository,
} from '../repository/path-list.repository';

export type ListPathsInput = {
  query: PathListQuery;
  viewer?: PathViewer;
};

/** API use-case: visibility filtering + pagination for path listing. */
export async function listPaths(
  input: ListPathsInput,
  repository: PathListRepository = pathListRepository,
): Promise<PathListResult> {
  const viewer = input.viewer ?? null;
  const visibilityWhere = buildPathVisibilityWhere(viewer);

  const { items: rows, total } = await repository.findManyWithCount({
    where: visibilityWhere,
    query: input.query,
  });

  const paths = rows
    .filter((path) => filterPathForAudience(path, viewer))
    .map((path) => mapPathListItemToDTO(path, viewer));

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
