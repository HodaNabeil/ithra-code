import { describe, expect, it } from 'vitest';

import { buildBreadcrumbSchema } from './builders/breadcrumb';
import { buildCourseSchema } from './builders/course';
import { buildOrganizationSchema } from './builders/organization';
import { buildWebsiteSchema } from './builders/website';
import { getOrganizationId, getWebsiteId } from '../urls';

const origin = 'https://ithracode.com';

describe('schema builders', () => {
  it('builds an Organization with a stable @id', () => {
    const schema = buildOrganizationSchema({
      origin,
      sameAs: ['https://youtube.com/@ithracode'],
    });

    expect(schema['@type']).toBe('Organization');
    expect(schema['@id']).toBe(getOrganizationId(origin));
    expect(schema.alternateName).toEqual([
      'ithracode',
      'إثراكود',
      'Ithra Code',
    ]);
    expect(schema.sameAs).toEqual(['https://youtube.com/@ithracode']);
  });

  it('adds SearchAction only when a template is provided', () => {
    const withSearch = buildWebsiteSchema({
      origin,
      searchUrlTemplate: `${origin}/courses?search={search_term_string}`,
    });
    const withoutSearch = buildWebsiteSchema({ origin });

    expect(withSearch['@id']).toBe(getWebsiteId(origin));
    expect(withSearch.potentialAction).toMatchObject({
      '@type': 'SearchAction',
    });
    expect(withoutSearch.potentialAction).toBeUndefined();
  });

  it('omits AggregateRating when there are no reviews', () => {
    const schema = buildCourseSchema({
      origin,
      name: 'React',
      description: 'Learn React',
      url: `${origin}/courses/react`,
      price: 99,
      currency: 'USD',
      rating: 0,
      ratingCount: 0,
    });

    expect(schema['@type']).toBe('Course');
    expect(schema.aggregateRating).toBeUndefined();
    expect(schema.provider).toEqual({ '@id': getOrganizationId(origin) });
    expect(schema.hasCourseInstance).toMatchObject({
      '@type': 'CourseInstance',
      courseMode: 'Online',
    });
  });

  it('includes AggregateRating only for real reviews', () => {
    const schema = buildCourseSchema({
      origin,
      name: 'React',
      description: 'Learn React',
      url: `${origin}/courses/react`,
      price: 99,
      currency: 'USD',
      rating: 4.5,
      ratingCount: 12,
    });

    expect(schema.aggregateRating).toEqual({
      '@type': 'AggregateRating',
      ratingValue: 4.5,
      reviewCount: 12,
    });
  });

  it('builds breadcrumbs that match the page hierarchy', () => {
    const schema = buildBreadcrumbSchema([
      { name: 'الدورات', url: `${origin}/courses` },
      { name: 'React', url: `${origin}/courses/react` },
    ]);

    expect(schema['@type']).toBe('BreadcrumbList');
    expect(schema.itemListElement).toHaveLength(2);
  });
});
