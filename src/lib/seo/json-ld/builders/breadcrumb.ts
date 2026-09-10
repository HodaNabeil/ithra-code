import type { JsonLdObject } from '../types';

export type BreadcrumbItemInput = {
  name: string;
  url: string;
};

export function buildBreadcrumbSchema(
  items: BreadcrumbItemInput[],
): JsonLdObject {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
