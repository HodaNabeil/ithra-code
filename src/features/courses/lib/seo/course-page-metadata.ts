import type { Metadata } from 'next';

import type { CourseDetailApiDTO } from '@/features/courses/course-detail';
import { APP_ROUTES } from '@/constants/enums';
import { CourseVisibility } from '@/generated/prisma/enums';
import {
  createNoIndexMetadata,
  createPageMetadata,
} from '@/lib/seo/create-page-metadata';
import { NOINDEX_FOLLOW } from '@/lib/seo/indexing';

export function buildCourseNotFoundMetadata(): Metadata {
  return createNoIndexMetadata({
    title: 'الكورس غير موجود',
    path: APP_ROUTES.COURSES,
  });
}

export function buildCourseMetadataErrorMetadata(): Metadata {
  return createNoIndexMetadata({
    title: 'خطأ في التحميل',
    path: APP_ROUTES.COURSES,
  });
}

export function buildCoursePageMetadata(course: CourseDetailApiDTO): Metadata {
  const title = course.metaTitle ?? course.title;
  const description =
    course.metaDescription ?? course.shortDescription ?? course.description;
  const isUnlisted = course.visibility === CourseVisibility.UNLISTED;

  return createPageMetadata({
    title,
    description,
    path: `${APP_ROUTES.COURSES}/${course.slug}`,
    imageUrl: course.thumbnailUrl || undefined,
    imageAlt: course.title,
    absoluteTitle: Boolean(course.metaTitle),
    robots: isUnlisted ? NOINDEX_FOLLOW : { index: true, follow: true },
  });
}
