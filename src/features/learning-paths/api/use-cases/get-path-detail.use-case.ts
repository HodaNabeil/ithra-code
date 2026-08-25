import type { PathViewer } from '../dto/path-catalog.dto';
import type { PathDetailResult } from '../dto/path-detail.dto';
import { PATH_NOT_FOUND_MESSAGE, PathDetailError } from '../errors/path.errors';
import { mapPathDetailEntityToDTO } from '../mapper/to-path-dto';
import { filterPathForAudience } from '../policies/path-visibility.policy';
import {
  pathDetailRepository,
  type PathDetailRepository,
} from '../repository/path-detail.repository';

export type GetPathDetailInput = {
  slug: string;
  viewer?: PathViewer;
};

/** API use-case: full path details with audience-filtered tracks and courses. */
export async function getPathDetail(
  input: GetPathDetailInput,
  repository: PathDetailRepository = pathDetailRepository,
): Promise<PathDetailResult> {
  const viewer = input.viewer ?? null;
  const entity = await repository.findBySlug(input.slug);

  if (!entity || !filterPathForAudience(entity, viewer)) {
    throw new PathDetailError(404, PATH_NOT_FOUND_MESSAGE, 'PATH_NOT_FOUND');
  }

  return {
    path: mapPathDetailEntityToDTO(entity, viewer),
  };
}
