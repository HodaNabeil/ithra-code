import {
  SEO_COURSE_SEARCH_PATH,
  SEO_COURSE_SEARCH_QUERY_PARAM,
  SEO_HTML_LANGUAGE,
  SEO_SITE_NAME_AR,
} from '../../config';
import { getOrganizationId, getWebsiteId } from '../../urls';
import type { JsonLdObject } from '../types';

export type WebsiteSchemaInput = {
  origin: string;
  name?: string;
  searchUrlTemplate?: string;
};

export function buildWebsiteSchema(input: WebsiteSchemaInput): JsonLdObject {
  const schema: JsonLdObject = {
    '@type': 'WebSite',
    '@id': getWebsiteId(input.origin),
    url: input.origin,
    name: input.name ?? SEO_SITE_NAME_AR,
    inLanguage: SEO_HTML_LANGUAGE,
    publisher: {
      '@id': getOrganizationId(input.origin),
    },
  };

  if (input.searchUrlTemplate) {
    schema.potentialAction = {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: input.searchUrlTemplate,
      },
      'query-input': 'required name=search_term_string',
    };
  }

  return schema;
}

export function buildCourseSearchUrlTemplate(origin: string): string {
  return `${origin}${SEO_COURSE_SEARCH_PATH}?${SEO_COURSE_SEARCH_QUERY_PARAM}={search_term_string}`;
}
