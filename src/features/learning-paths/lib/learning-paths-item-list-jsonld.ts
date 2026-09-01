import type { PathListDTO } from '@/types/path/path.dto';

const SITE_ORIGIN = 'https://ithracode.com';

export function buildLearningPathsListingJsonLd(paths: PathListDTO[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: paths.length,
    itemListElement: paths.map((path, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'CreativeWork',
        url: `${SITE_ORIGIN}/learning-paths/${path.slug}`,
        name: path.title,
        description: path.summary || path.tagline,
        provider: {
          '@type': 'Organization',
          name: 'إثرالكود',
          sameAs: SITE_ORIGIN,
        },
      },
    })),
  };
}
