import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Script from 'next/script';

import { LearningPathHeader } from '@/features/learning-paths/[slug]/components/learning-path-header';
import { PathTracks } from '@/features/learning-paths/[slug]/components/path-tracks';
import { PathDownload } from '@/features/learning-paths/[slug]/components/path-download';
import PathSections from '@/features/learning-paths/[slug]/components/path-Sections';
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
    <>
      <Script
        id="path-detail-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen">
        <div className="py-16 container">
          <LearningPathHeader data={result.path} />

          <div className="max-w-prose mt-10">
            <PathSections sections={result.path.sections} />

            <PathTracks tracks={result.path.tracks} />
            <div className="mt-12 border-t pt-8">
              <PathDownload slug={result.path.slug} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
