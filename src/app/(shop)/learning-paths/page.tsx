import { Suspense } from 'react';
import { Metadata } from 'next';
import Script from 'next/script';

import { ErrorRetry } from '@/components/shared/ErrorRetry';
import {
  PathsHero,
  PathsContainer,
  PathsListSkeleton,
} from '@/features/learning-paths/components';
import { buildLearningPathsItemListJsonLd } from '@/features/learning-paths/lib/learning-paths-item-list-jsonld';
import { loadLearningPathsListing } from '@/features/learning-paths/lib/learning-paths-listing-data';
import { buildLearningPathsListingMetadata } from '@/features/learning-paths/lib/learning-paths-listing-metadata';
import {
  parseLearningPathsPageSearchParams,
  type LearningPathsPageSearchParamsInput,
} from '@/features/learning-paths/lib/learning-paths-page-query';

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

export default async function LearningPaths({
  searchParams,
}: LearningPathsPageProps) {
  const raw = await searchParams;
  const query = parseLearningPathsPageSearchParams(raw);
  const listing = await loadLearningPathsListing(query);

  const paths = listing.ok ? listing.paths : [];
  const itemListSchema = buildLearningPathsItemListJsonLd(paths);

  const suspenseKey = `${query.search}-${query.page}-${query.sort}-${query.category ?? ''}`;

  return (
    <>
      <Script
        id="paths-list-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <main className="py-14 space-y-8">
        <PathsHero />
        <Suspense
          key={suspenseKey}
          fallback={
            <div className="container">
              <PathsListSkeleton />
            </div>
          }
        >
          {listing.ok && <PathsContainer paths={listing.paths} />}
        </Suspense>
        {!listing.ok && <ErrorRetry />}
      </main>
    </>
  );
}
