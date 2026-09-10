import { getOrganizationId, getWebPageId, getWebsiteId } from '../../urls';
import type { JsonLdObject } from '../types';

export type WebPageSchemaInput = {
  origin: string;
  path: string;
  name: string;
  description?: string;
  url: string;
};

export function buildWebPageSchema(input: WebPageSchemaInput): JsonLdObject {
  return {
    '@type': 'WebPage',
    '@id': getWebPageId(input.path, input.origin),
    url: input.url,
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    isPartOf: {
      '@id': getWebsiteId(input.origin),
    },
    about: {
      '@id': getOrganizationId(input.origin),
    },
  };
}
