import {
  SEO_LOGO_PATH,
  SEO_SITE_ALTERNATE_NAMES,
  SEO_SITE_NAME_AR,
} from '../../config';
import { getOrganizationId, toAbsoluteAssetUrl } from '../../urls';
import type { JsonLdObject } from '../types';

export type OrganizationSchemaInput = {
  origin: string;
  name?: string;
  logoPath?: string;
  sameAs?: readonly string[];
};

export function buildOrganizationSchema(
  input: OrganizationSchemaInput,
): JsonLdObject {
  const name = input.name ?? SEO_SITE_NAME_AR;

  return {
    '@type': 'Organization',
    '@id': getOrganizationId(input.origin),
    name,
    alternateName: [...SEO_SITE_ALTERNATE_NAMES],
    url: input.origin,
    logo: {
      '@type': 'ImageObject',
      url: toAbsoluteAssetUrl(input.logoPath ?? SEO_LOGO_PATH, input.origin),
    },
    ...(input.sameAs && input.sameAs.length > 0
      ? { sameAs: [...input.sameAs] }
      : {}),
  };
}
