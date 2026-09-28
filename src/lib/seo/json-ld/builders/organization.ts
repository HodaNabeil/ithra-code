import {
  SEO_DEFAULT_DESCRIPTION,
  SEO_LOGO_PATH,
  SEO_SITE_ALTERNATE_NAMES,
  SEO_SITE_NAME_EN,
} from '../../config';
import { toMetaDescription } from '../../description';
import {
  getOrganizationId,
  getPersonId,
  toAbsoluteAssetUrl,
} from '../../urls';
import type { JsonLdObject } from '../types';

export type OrganizationSchemaInput = {
  origin: string;
  name?: string;
  logoPath?: string;
  sameAs?: readonly string[];
  description?: string;
};

export function buildOrganizationSchema(
  input: OrganizationSchemaInput,
): JsonLdObject {
  const name = input.name ?? SEO_SITE_NAME_EN;
  const description = toMetaDescription(
    input.description ?? SEO_DEFAULT_DESCRIPTION,
  );

  return {
    '@type': ['Organization', 'EducationalOrganization'],
    '@id': getOrganizationId(input.origin),
    name,
    alternateName: [...SEO_SITE_ALTERNATE_NAMES],
    description,
    url: input.origin,
    logo: {
      '@type': 'ImageObject',
      url: toAbsoluteAssetUrl(input.logoPath ?? SEO_LOGO_PATH, input.origin),
    },
    founder: {
      '@id': getPersonId(input.origin),
    },
    ...(input.sameAs && input.sameAs.length > 0
      ? { sameAs: [...input.sameAs] }
      : {}),
  };
}
