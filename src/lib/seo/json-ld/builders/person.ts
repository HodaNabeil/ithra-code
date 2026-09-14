import { PUBLIC_ROUTES } from '@/constants/routes';

import {
  SEO_AUTHOR_ALTERNATE_NAMES,
  SEO_AUTHOR_JOB_TITLE,
  SEO_AUTHOR_NAME,
  SEO_AUTHOR_NAME_AR,
  SEO_SAME_AS,
} from '../../config';
import { getOrganizationId, getPersonId, toCanonicalUrl } from '../../urls';
import type { JsonLdObject } from '../types';

export type PersonSchemaInput = {
  origin: string;
  name?: string;
  alternateName?: readonly string[];
  jobTitle?: string;
  url?: string;
  sameAs?: readonly string[];
};

export function buildPersonSchema(input: PersonSchemaInput): JsonLdObject {
  const alternateName = input.alternateName ?? [
    SEO_AUTHOR_NAME_AR,
    ...SEO_AUTHOR_ALTERNATE_NAMES,
  ];

  return {
    '@type': 'Person',
    '@id': getPersonId(input.origin),
    name: input.name ?? SEO_AUTHOR_NAME,
    alternateName: [...alternateName],
    jobTitle: input.jobTitle ?? SEO_AUTHOR_JOB_TITLE,
    url: input.url ?? toCanonicalUrl(PUBLIC_ROUTES.ABOUT, input.origin),
    worksFor: {
      '@id': getOrganizationId(input.origin),
    },
    ...(input.sameAs && input.sameAs.length > 0
      ? { sameAs: [...input.sameAs] }
      : { sameAs: [...SEO_SAME_AS] }),
  };
}
