import {
  SEO_SITE_NAME_EN,
  SEO_SITE_ALTERNATE_NAMES,
  SEO_DEFAULT_DESCRIPTION,
} from '../config';
import { getCanonicalOrigin, toCanonicalUrl } from '../urls';

/**
 * Builds Schema.org WebSite structured data for the root layout.
 * This tells Google to display "IthraCode" as the site name in search results
 * instead of the domain name "ithracode.tech".
 *
 * @see https://developers.google.com/search/docs/appearance/site-names
 * @see https://schema.org/WebSite
 */
export function buildWebSiteSchema() {
  const siteUrl = toCanonicalUrl('/');

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${getCanonicalOrigin()}/#website`,
    url: siteUrl,
    name: SEO_SITE_NAME_EN,
    alternateName: [...SEO_SITE_ALTERNATE_NAMES],
    description: SEO_DEFAULT_DESCRIPTION,
    inLanguage: 'ar',
  };
}
