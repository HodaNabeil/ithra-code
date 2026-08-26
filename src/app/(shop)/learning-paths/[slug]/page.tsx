import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Script from 'next/script';

import { PathHero } from '@/features/learning-paths/[slug]/components/path-hero';
import { PathTracks } from '@/features/learning-paths/[slug]/components/path-tracks';
import { ErrorRetry } from '@/components/shared/ErrorRetry';
import { loadPathDetailBySlug } from '@/features/learning-paths/lib/learning-path-detail-data';
import { buildLearningPathDetailJsonLd } from '@/features/learning-paths/lib/learning-path-detail-jsonld';
import { resolveLearningPathDetailMetadata } from '@/features/learning-paths/lib/learning-path-detail-metadata';

type PathSlugPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: PathSlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  return resolveLearningPathDetailMetadata(slug);
}

export default async function LearningPathDetailPage({
  params,
}: PathSlugPageProps) {
  const { slug } = await params;
  const result = await loadPathDetailBySlug(slug);

  if (result.status === 'not_found') {
    notFound();
  }

  if (result.status === 'error') {
    console.error('Learning Path Detail Page Error:', result.error);
    return <ErrorRetry />;
  }

  const jsonLd = buildLearningPathDetailJsonLd(result.path);

  return (
    <main>
      <Script
        id="path-detail-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PathHero path={result.path} />

      {result.path.tracks && result.path.tracks.length > 0 && (
        <PathTracks tracks={result.path.tracks} />
      )}
    </main>
  );
}
