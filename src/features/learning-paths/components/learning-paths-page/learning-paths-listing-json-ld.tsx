import Script from 'next/script';

import { getPaths } from '@/features/learning-paths/api';
import { buildLearningPathsListingJsonLd } from '@/features/learning-paths/lib/learning-paths-item-list-jsonld';
import type { PathListDTO } from '@/types/path/path.dto';
import type { GetPublicPathsParams } from '@/types/path/path.types';

type LearningPathsListingJsonLdProps = {
  params: GetPublicPathsParams;
};

export async function LearningPathsListingJsonLd({
  params,
}: LearningPathsListingJsonLdProps) {
  let paths: PathListDTO[] = [];

  try {
    const data = await getPaths(params);
    paths = data.paths;
  } catch {
    paths = [];
  }

  return (
    <Script
      id="learning-paths-list-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(buildLearningPathsListingJsonLd(paths)),
      }}
    />
  );
}
