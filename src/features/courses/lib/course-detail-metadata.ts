import type { Metadata } from 'next';
import type { CourseDetailDTO } from '@/types/course/course.dto';
import { loadCourseDetailBySlug } from '@/features/courses/course-detail';

const SITE_ORIGIN = 'https://ithracode.com';
const DEFAULT_OG_IMAGE = '/default-course.png';

export function buildCourseNotFoundMetadata(): Metadata {
  return {
    title: 'الكورس غير موجود',
    robots: { index: false },
  };
}

export function buildCourseMetadataErrorMetadata(): Metadata {
  return {
    title: 'خطأ في التحميل | إثرالكود',
    robots: { index: false },
  };
}

export function buildCourseDetailMetadata(
  slug: string,
  course: CourseDetailDTO,
): Metadata {
  const title = `${course.title} | منصة إثرالكود`;
  const description = course.description;
  const imageUrl = course.thumbnailUrl || DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    metadataBase: new URL(SITE_ORIGIN),
    openGraph: {
      title: course.title,
      description: course.description,
      images: [{ url: imageUrl, width: 1200, height: 630 }],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: `${SITE_ORIGIN}/courses/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      site: '@ithracode',
      title: course.title,
      description: course.description,
      images: [imageUrl],
    },
  };
}

export async function resolveCourseDetailMetadata(
  slug: string,
): Promise<Metadata> {
  const result = await loadCourseDetailBySlug(slug);

  if (result.status === 'ok') {
    return buildCourseDetailMetadata(slug, result.course);
  }
  if (result.status === 'not_found') {
    return buildCourseNotFoundMetadata();
  }
  return buildCourseMetadataErrorMetadata();
}
