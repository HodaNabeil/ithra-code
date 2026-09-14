import { toMetaDescription } from '@/lib/seo/description';
import {
  getDefaultOrganizationSchema,
  getDefaultPersonSchema,
} from '@/lib/seo/json-ld/defaults';
import { buildJsonLdGraph } from '@/lib/seo/json-ld/types';
import { getSiteOrigin, toCanonicalUrl } from '@/lib/seo/urls';

import { buildWebPageSchema } from './webpage';

export function buildStaticWebPageJsonLd(input: {
  path: string;
  name: string;
  description: string;
  includeFounder?: boolean;
}) {
  const origin = getSiteOrigin();
  const url = toCanonicalUrl(input.path);

  return buildJsonLdGraph([
    getDefaultOrganizationSchema(origin),
    input.includeFounder ? getDefaultPersonSchema(origin) : null,
    buildWebPageSchema({
      origin,
      path: input.path,
      name: input.name,
      description: toMetaDescription(input.description),
      url,
    }),
  ]);
}
