import { env } from '@/config/env';

import { SEO_CANONICAL_ORIGIN } from './config';
import { isSeoIndexingEnabled } from './environment';

/** Origin used for canonical URLs, metadataBase, and JSON-LD @id in production. */
export function getCanonicalOrigin(
  appOrigin: string = env.NEXT_PUBLIC_APP_URL,
): string {
  const siteOrigin = appOrigin.replace(/\/+$/, '');

  if (isSeoIndexingEnabled({ origin: siteOrigin })) {
    return SEO_CANONICAL_ORIGIN;
  }

  return siteOrigin;
}
