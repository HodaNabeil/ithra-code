import { Metadata } from 'next';

import { ErrorRetry } from '@/components/shared/ErrorRetry';
import {
  LearningPathsContainer,
  LearningPathsHero,
  LearningPathsListingJsonLd,
} from '@/features/learning-paths/components';
import { getPaths } from '@/features/learning-paths/api';
import { buildLearningPathsListingMetadata } from '@/features/learning-paths/lib/learning-paths-listing-metadata';
import {
  learningPathsPageQueryToGetPathsParams,
  parseLearningPathsPageSearchParams,
  type LearningPathsPageSearchParamsInput,
} from '@/features/learning-paths/lib/learning-paths-page-query';
import type { PathListDTO } from '@/types/path/path.dto';

interface LearningPathsPageProps {
  searchParams: Promise<LearningPathsPageSearchParamsInput>;
}

export async function generateMetadata({
  searchParams,
}: LearningPathsPageProps): Promise<Metadata> {
  const raw = await searchParams;
  const query = parseLearningPathsPageSearchParams(raw);
  return buildLearningPathsListingMetadata(query);
}

export default async function LearningPathsPage({
  searchParams,
}: LearningPathsPageProps) {
  const raw = await searchParams;
  const query = parseLearningPathsPageSearchParams(raw);

  let paths: PathListDTO[] = [];
  let pagination: { currentPage: number; totalPages: number } | undefined;
  let hasError = false;

  try {
    const pathsResponse = await getPaths(
      learningPathsPageQueryToGetPathsParams(query),
    );
    paths = pathsResponse.paths;
    pagination = {
      currentPage: pathsResponse.currentPage,
      totalPages: pathsResponse.totalPages,
    };
  } catch {
    hasError = true;
  }

  return (
    <>
      <LearningPathsListingJsonLd
        params={learningPathsPageQueryToGetPathsParams(query)}
      />

      <main className="py-14 space-y-8">
        <LearningPathsHero />

        {!hasError && pagination && (
          <LearningPathsContainer paths={paths} />
        )}

        {hasError && <ErrorRetry />}
      </main>
    </>
  );
}
