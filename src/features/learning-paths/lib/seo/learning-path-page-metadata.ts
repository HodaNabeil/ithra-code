import type { Metadata } from 'next';

import { APP_ROUTES } from '@/constants/enums';
import type { PathDetailDTO } from '@/types/path/path.dto';
import {
  createNoIndexMetadata,
  createPageMetadata,
} from '@/lib/seo/create-page-metadata';

export function buildPathNotFoundMetadata(): Metadata {
  return createNoIndexMetadata({
    title: 'المسار غير موجود',
    path: APP_ROUTES.LEARNING_PATHS,
  });
}

export function buildPathMetadataErrorMetadata(): Metadata {
  return createNoIndexMetadata({
    title: 'خطأ في التحميل',
    path: APP_ROUTES.LEARNING_PATHS,
  });
}

export function buildLearningPathPageMetadata(path: PathDetailDTO): Metadata {
  const title = path.metaTitle || path.title;
  const description =
    path.metaDescription || path.summary || path.tagline || '';

  return createPageMetadata({
    title,
    description,
    path: `${APP_ROUTES.LEARNING_PATHS}/${path.slug}`,
    imageUrl: path.thumbnailUrl || undefined,
    imageAlt: path.title,
    absoluteTitle: Boolean(path.metaTitle),
  });
}
