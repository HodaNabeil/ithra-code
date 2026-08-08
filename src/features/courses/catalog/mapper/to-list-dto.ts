import type { CourseListDTO } from '@/types/course/course.dto';
import type { CourseCatalogItem, CourseCatalogResult } from '../dto/course-catalog.dto';
import type { GetCoursesResult } from '@/types/course/course.types';

/** Strips RBAC-only fields and maps to the shared list/card DTO. */
export function mapCatalogItemToListDTO(
  item: CourseCatalogItem,
): CourseListDTO {
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    description: item.description,
    thumbnailUrl: item.thumbnailUrl,
    price: item.price,
    compareAtPrice: item.compareAtPrice,
    currency: item.currency,
    duration: item.duration,
    level: item.level,
    objectives: item.objectives,
    rating: item.rating,
    ratingCount: item.ratingCount,
    lecturesCount: item.lecturesCount,
    hours: item.hours,
    firstLectureId: item.firstLectureId,
    isPurchased: item.isPurchased,
    isInCart: item.isInCart,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    publishedAt: item.publishedAt,
  };
}

export function mapCatalogResultToGetCoursesResult(
  result: CourseCatalogResult,
): GetCoursesResult {
  return {
    courses: result.courses.map(mapCatalogItemToListDTO),
    total: result.pagination.total,
    totalPages: result.pagination.totalPages,
    currentPage: result.pagination.page,
  };
}
