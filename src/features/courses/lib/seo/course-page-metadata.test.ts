import { describe, expect, it, vi } from 'vitest';

import type { CourseDetailApiDTO } from '@/features/courses/course-detail';
import { CourseVisibility } from '@/generated/prisma/enums';

vi.mock('@/lib/seo/environment', () => ({
  isSeoIndexingEnabled: vi.fn(() => true),
}));

import { buildCoursePageMetadata } from './course-page-metadata';

function makeCourse(
  overrides: Partial<CourseDetailApiDTO> = {},
): CourseDetailApiDTO {
  return {
    id: 'course-1',
    title: 'دورة React',
    description: '<p>تعلم React من الصفر</p>',
    shortDescription: 'مقدمة في React',
    slug: 'react',
    thumbnailUrl: 'https://images.unsplash.com/photo.jpg',
    previewVideo: null,
    instructorId: 'instructor-1',
    price: 99,
    compareAtPrice: null,
    currency: 'USD',
    level: 'BEGINNER',
    status: 'PUBLISHED',
    visibility: CourseVisibility.PUBLIC,
    isFeatured: false,
    hours: 10,
    requirements: [],
    objectives: [],
    targetAudience: [],
    tags: [],
    prerequisiteIds: [],
    prerequisites: [],
    firstLectureId: undefined,
    lecturesCount: 12,
    sections: [],
    rating: 0,
    ratingCount: 0,
    metaTitle: null,
    metaDescription: null,
    certificateEnabled: false,
    maxStudents: null,
    pathId: 'path-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    publishedAt: '2026-01-01T00:00:00.000Z',
    isPurchased: false,
    isInCart: false,
    ...overrides,
  };
}

describe('buildCoursePageMetadata', () => {
  it('prefers SEO override fields over display content', () => {
    const metadata = buildCoursePageMetadata(
      makeCourse({
        metaTitle: 'React للمبتدئين | إثرالكود',
        metaDescription: 'وصف مخصص لمحركات البحث',
      }),
    );

    expect(metadata.title).toEqual({
      absolute: 'React للمبتدئين | إثرالكود',
    });
    expect(metadata.description).toBe('وصف مخصص لمحركات البحث');
  });

  it('falls back to short description then description', () => {
    const metadata = buildCoursePageMetadata(makeCourse());

    expect(metadata.title).toBe('دورة React');
    expect(metadata.description).toBe('مقدمة في React');
  });

  it('marks unlisted courses as noindex', () => {
    const metadata = buildCoursePageMetadata(
      makeCourse({ visibility: CourseVisibility.UNLISTED }),
    );

    expect(metadata.robots).toEqual({ index: false, follow: true });
  });
});
