import { getOrganizationId } from '../../urls';
import type { JsonLdObject } from '../types';

export type CourseSchemaInput = {
  origin: string;
  name: string;
  description: string;
  url: string;
  imageUrl?: string;
  price: number;
  currency: string;
  rating?: number;
  ratingCount?: number;
};

export function buildCourseSchema(input: CourseSchemaInput): JsonLdObject {
  const offer: JsonLdObject = {
    '@type': 'Offer',
    price: input.price,
    priceCurrency: input.currency,
    url: input.url,
    availability: 'https://schema.org/InStock',
  };

  const schema: JsonLdObject = {
    '@type': 'Course',
    '@id': `${input.url}#course`,
    name: input.name,
    description: input.description,
    url: input.url,
    provider: {
      '@id': getOrganizationId(input.origin),
    },
    offers: offer,
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'Online',
      offers: offer,
    },
  };

  if (input.imageUrl) {
    schema.image = input.imageUrl;
  }

  if (
    input.ratingCount != null &&
    input.ratingCount > 0 &&
    input.rating != null
  ) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: input.rating,
      reviewCount: input.ratingCount,
    };
  }

  return schema;
}
