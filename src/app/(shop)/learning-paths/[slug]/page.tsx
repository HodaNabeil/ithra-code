import { notFound } from 'next/navigation';
import { Metadata } from 'next';

import { PathHero } from '@/features/learning-paths/[slug]/components/path-hero';
import { PathTracks } from '@/features/learning-paths/[slug]/components/path-tracks';
import { ErrorRetry } from '@/components/shared/ErrorRetry';
import { loadPathDetailBySlug } from '@/features/learning-paths/lib/learning-path-detail-data';
import { buildLearningPathPageJsonLd } from '@/features/learning-paths/lib/seo/learning-path-page-schema.adapter';
import { resolveLearningPathDetailMetadata } from '@/features/learning-paths/lib/seo/resolve-learning-path-page-metadata';
import { JsonLd } from '@/lib/seo/json-ld/json-ld';

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

  return (
    <main>
      <JsonLd
        id="path-detail-jsonld"
        data={buildLearningPathPageJsonLd(result.path)}
      />
      <PathHero path={result.path} />

      {result.path.tracks && result.path.tracks.length > 0 && (
        <PathTracks tracks={result.path.tracks} />
      )}
    </main>
  );
}
