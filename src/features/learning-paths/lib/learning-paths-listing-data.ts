import { getPaths } from '@/features/learning-paths/api';
import type { PathListDTO } from '@/types/path/path.dto';
import type { LearningPathsPageQuery } from './learning-paths-page-query';
import { learningPathsPageQueryToPathCatalogQuery } from './learning-paths-page-query';

export type LearningPathsListingData =
  | { ok: true; paths: PathListDTO[] }
  | { ok: false; error: unknown };

export async function loadLearningPathsListing(
  query: LearningPathsPageQuery,
): Promise<LearningPathsListingData> {
  try {
    const { paths } = await getPaths(
      learningPathsPageQueryToPathCatalogQuery(query),
    );
    return { ok: true, paths };
  } catch (error) {
    console.error('Failed to fetch learning paths:', error);
    return { ok: false, error };
  }
}
