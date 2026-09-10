import { getOrganizationId } from '../../urls';
import type { JsonLdObject } from '../types';

export type ItemListEntryInput = {
  type: string;
  url: string;
  name: string;
  description?: string;
};

export type ItemListSchemaInput = {
  origin: string;
  items: ItemListEntryInput[];
  includeProvider?: boolean;
};

export function buildItemListSchema(input: ItemListSchemaInput): JsonLdObject {
  const includeProvider = input.includeProvider ?? true;

  return {
    '@type': 'ItemList',
    numberOfItems: input.items.length,
    itemListElement: input.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': item.type,
        url: item.url,
        name: item.name,
        ...(item.description ? { description: item.description } : {}),
        ...(includeProvider
          ? {
              provider: {
                '@id': getOrganizationId(input.origin),
              },
            }
          : {}),
      },
    })),
  };
}
