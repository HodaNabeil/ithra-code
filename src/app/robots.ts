import { env } from '@/config/env';
import { buildRobotsConfig } from '@/lib/seo/robots';
import { isSeoIndexingEnabled } from '@/lib/seo/environment';
import { getSiteOrigin } from '@/lib/seo/urls';
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return buildRobotsConfig({
    indexingEnabled: isSeoIndexingEnabled({
      nodeEnv: env.NODE_ENV,
      origin: getSiteOrigin(),
    }),
    origin: getSiteOrigin(),
  });
}
