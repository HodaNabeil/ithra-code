import type { Metadata } from 'next';

import {
  SEO_OG_IMAGE_HEIGHT,
  SEO_OG_IMAGE_WIDTH,
  SEO_OG_LOCALE,
  SEO_SITE_NAME_EN,
  SEO_TWITTER_SITE,
} from './config';
import { toMetaDescription } from './description';
import { isSeoIndexingEnabled } from './environment';
import { INDEX_FOLLOW } from './indexing';
import { toAbsoluteAssetUrl, toCanonicalUrl } from './urls';

export type PageRobots = {
  index: boolean;
  follow: boolean;
};

export type CreatePageMetadataInput = {
  title: string;
  description?: string | null;
  path: string;
  imageUrl?: string | null;
  imageAlt?: string;
  keywords?: string[];
  openGraphType?: 'website' | 'article';
  robots?: PageRobots;
  absoluteTitle?: boolean;
};

export function createPageMetadata(input: CreatePageMetadataInput): Metadata {
  const description = toMetaDescription(input.description) || undefined;
  const canonicalUrl = toCanonicalUrl(input.path);
  const imageUrl = input.imageUrl
    ? toAbsoluteAssetUrl(input.imageUrl)
    : undefined;
  const indexingEnabled = isSeoIndexingEnabled();
  const robots = input.robots ?? INDEX_FOLLOW;

  return {
    title: input.absoluteTitle ? { absolute: input.title } : input.title,
    description,
    keywords: input.keywords,
    robots: {
      index: indexingEnabled && robots.index,
      follow: indexingEnabled && robots.follow,
    },
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: input.title,
      description,
      url: canonicalUrl,
      type: input.openGraphType ?? 'website',
      locale: SEO_OG_LOCALE,
      siteName: SEO_SITE_NAME_EN,
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: SEO_OG_IMAGE_WIDTH,
              height: SEO_OG_IMAGE_HEIGHT,
              alt: input.imageAlt ?? input.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      site: SEO_TWITTER_SITE,
      title: input.title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export function createNoIndexMetadata(input: {
  title: string;
  path: string;
  description?: string | null;
}): Metadata {
  return createPageMetadata({
    title: input.title,
    path: input.path,
    description: input.description,
    robots: { index: false, follow: false },
  });
}
