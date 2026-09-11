import type { Metadata } from 'next';

import { APP_ROUTES } from '@/constants/enums';
import {
  SEO_AUTHOR_NAME,
  SEO_DEFAULT_DESCRIPTION,
  SEO_DEFAULT_TITLE,
  SEO_HOME_KEYWORDS,
  SEO_SITE_NAME_AR,
  SEO_SITE_NAME_EN,
} from '@/lib/seo/config';
import { createPageMetadata } from '@/lib/seo/create-page-metadata';

export function buildHomePageMetadata(): Metadata {
  const title = `${SEO_DEFAULT_TITLE} | ${SEO_SITE_NAME_AR}`;

  return {
    ...createPageMetadata({
      title,
      absoluteTitle: true,
      description: SEO_DEFAULT_DESCRIPTION,
      path: APP_ROUTES.ROOT,
      keywords: [...SEO_HOME_KEYWORDS],
    }),
    authors: [{ name: SEO_AUTHOR_NAME }],
    creator: SEO_SITE_NAME_EN,
    publisher: SEO_SITE_NAME_EN,
  };
}
