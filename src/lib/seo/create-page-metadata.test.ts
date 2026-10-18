import { describe, expect, it, vi } from 'vitest';
import type { Metadata } from 'next';

vi.mock('./environment', () => ({
  isSeoIndexingEnabled: vi.fn(() => true),
}));

import {
  createNoIndexMetadata,
  createPageMetadata,
} from './create-page-metadata';
import { isSeoIndexingEnabled } from './environment';

function twitterCard(metadata: Metadata) {
  const twitter = metadata.twitter;
  if (twitter && 'card' in twitter) {
    return twitter.card;
  }
  return undefined;
}

describe('createPageMetadata', () => {
  it('uses a page title that the root template can extend', () => {
    const metadata = createPageMetadata({
      title: 'الدورات التدريبية',
      description: 'دورات البرمجة',
      path: '/courses',
    });

    expect(metadata.title).toBe('الدورات التدريبية');
    expect(metadata.alternates?.canonical).toBe(
      'https://ithracode.tech/courses',
    );
    expect(metadata.alternates?.languages).toEqual({
      ar: 'https://ithracode.tech/courses',
      en: 'https://ithracode.tech/courses',
      'x-default': 'https://ithracode.tech/courses',
    });
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });

  it('supports absolute titles for CMS overrides', () => {
    const metadata = createPageMetadata({
      title: 'عنوان مخصص بالكامل',
      path: '/courses/react',
      absoluteTitle: true,
    });

    expect(metadata.title).toEqual({ absolute: 'عنوان مخصص بالكامل' });
  });

  it('cleans descriptions and uses OG images (default or custom)', () => {
    const withoutImage = createPageMetadata({
      title: 'دورة',
      description: '<p>Learn   React</p>',
      path: '/courses/react',
    });
    const withImage = createPageMetadata({
      title: 'دورة',
      description: 'Learn React',
      path: '/courses/react',
      imageUrl: '/img/course.png',
    });

    expect(withoutImage.description).toBe('Learn React');
    expect(twitterCard(withoutImage)).toBe('summary_large_image');
    expect(twitterCard(withImage)).toBe('summary_large_image');
    expect(withoutImage.openGraph?.images).toEqual([
      {
        url: 'https://ithracode.tech/img/ithracode.png',
        width: 1200,
        height: 630,
        alt: 'دورة',
      },
    ]);
    expect(withImage.openGraph?.images).toEqual([
      {
        url: 'https://ithracode.tech/img/course.png',
        width: 1200,
        height: 630,
        alt: 'دورة',
      },
    ]);
  });

  it('forces noindex when the environment is not indexable', () => {
    vi.mocked(isSeoIndexingEnabled).mockReturnValue(false);

    const metadata = createPageMetadata({
      title: 'الرئيسية',
      path: '/',
      robots: { index: true, follow: true },
    });

    expect(metadata.robots).toEqual({ index: false, follow: false });

    vi.mocked(isSeoIndexingEnabled).mockReturnValue(true);
  });

  it('builds noindex metadata for private pages', () => {
    const metadata = createNoIndexMetadata({
      title: 'سلة المشتريات',
      path: '/cart',
    });

    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.alternates?.canonical).toBe('https://ithracode.tech/cart');
  });
});
