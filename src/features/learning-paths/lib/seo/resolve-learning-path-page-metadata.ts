import type { Metadata } from 'next';

import { loadPathDetailBySlug } from '@/features/learning-paths/lib/learning-path-detail-data';

import {
  buildLearningPathPageMetadata,
  buildPathMetadataErrorMetadata,
  buildPathNotFoundMetadata,
} from './learning-path-page-metadata';

export async function resolveLearningPathDetailMetadata(
  slug: string,
): Promise<Metadata> {
  const result = await loadPathDetailBySlug(slug);

  if (result.status === 'ok') {
    return buildLearningPathPageMetadata(result.path);
  }
  if (result.status === 'not_found') {
    return buildPathNotFoundMetadata();
  }
  return buildPathMetadataErrorMetadata();
}
