import type { Metadata } from 'next';

import {
  SEO_DEFAULT_DESCRIPTION,
  SEO_DEFAULT_OG_IMAGE_PATH,
  SEO_GLOBAL_KEYWORDS,
  SEO_GOOGLE_SITE_VERIFICATION,
  SEO_HOME_DOCUMENT_TITLE,
  SEO_OG_IMAGE_HEIGHT,
  SEO_OG_IMAGE_WIDTH,
  SEO_OG_LOCALE,
  SEO_SITE_NAME_EN,
  SEO_TITLE_TEMPLATE_SUFFIX,
  SEO_TWITTER_SITE,
} from './config';
import { toMetaDescription } from './description';
import { isSeoIndexingEnabled } from './environment';
import { buildHreflangAlternates } from './create-page-metadata';
import {
  getCanonicalOrigin,
  toAbsoluteAssetUrl,
  toCanonicalUrl,
} from './urls';

export function buildRootLayoutMetadata(): Metadata {
  const description = toMetaDescription(SEO_DEFAULT_DESCRIPTION) || undefined;
  const canonicalUrl = toCanonicalUrl('/');
  const ogImageUrl = toAbsoluteAssetUrl(SEO_DEFAULT_OG_IMAGE_PATH);
  const indexingEnabled = isSeoIndexingEnabled();

  return {
    metadataBase: new URL(getCanonicalOrigin()),
    applicationName: SEO_SITE_NAME_EN,
    title: {
      default: SEO_HOME_DOCUMENT_TITLE,
      template: `%s | ${SEO_TITLE_TEMPLATE_SUFFIX}`,
    },
    description,
    keywords: [...SEO_GLOBAL_KEYWORDS],
    robots: {
      index: indexingEnabled,
      follow: indexingEnabled,
    },
    alternates: buildHreflangAlternates(canonicalUrl),
    openGraph: {
      title: SEO_HOME_DOCUMENT_TITLE,
      description,
      url: canonicalUrl,
      type: 'website',
      locale: SEO_OG_LOCALE,
      siteName: SEO_SITE_NAME_EN,
      images: [
        {
          url: ogImageUrl,
          width: SEO_OG_IMAGE_WIDTH,
          height: SEO_OG_IMAGE_HEIGHT,
          alt: SEO_HOME_DOCUMENT_TITLE,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: SEO_TWITTER_SITE,
      title: SEO_HOME_DOCUMENT_TITLE,
      description,
      images: [ogImageUrl],
    },
    verification: {
      google: SEO_GOOGLE_SITE_VERIFICATION,
    },
  };
}
