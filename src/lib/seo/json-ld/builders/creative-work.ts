import { getOrganizationId } from '../../urls';
import type { JsonLdObject } from '../types';

export type CreativeWorkPartInput = {
  name: string;
  description?: string;
};

export type CreativeWorkSchemaInput = {
  origin: string;
  name: string;
  description?: string;
  url: string;
  imageUrl?: string;
  hasPart?: CreativeWorkPartInput[];
};

export function buildCreativeWorkSchema(
  input: CreativeWorkSchemaInput,
): JsonLdObject {
  return {
    '@type': 'CreativeWork',
    '@id': `${input.url}#creativework`,
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    url: input.url,
    ...(input.imageUrl ? { image: input.imageUrl } : {}),
    provider: {
      '@id': getOrganizationId(input.origin),
    },
    ...(input.hasPart && input.hasPart.length > 0
      ? {
          hasPart: input.hasPart.map((part) => ({
            '@type': 'CreativeWork',
            name: part.name,
            ...(part.description ? { description: part.description } : {}),
          })),
        }
      : {}),
  };
}
