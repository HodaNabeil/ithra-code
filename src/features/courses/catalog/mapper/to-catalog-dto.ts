import type { DB_CourseCatalogItem } from '../repository/course-catalog.select';
import type { CourseCatalogPublicItem } from '../dto/course-catalog.dto';
import {
  computeRating,
  prismaDateToIso,
  prismaDateToIsoNullable,
} from '@/features/courses/course-detail/mapper/shared';

function computeListAggregates(course: DB_CourseCatalogItem) {
  const sections = course.sections ?? [];
  const lecturesCount = sections.reduce(
    (acc, section) => acc + (section.lectures?.length ?? 0),
    0,
  );
  const totalSeconds = sections.reduce(
    (acc, section) =>
      acc +
      (section.lectures ?? []).reduce(
        (sum, lecture) => sum + (lecture.video?.duration || 0),
        0,
      ),
    0,
  );
  const hours =
    totalSeconds > 0
      ? Math.round(totalSeconds / 3600)
      : course.duration
        ? Math.round(course.duration / 60)
        : null;
  const firstLectureId = sections[0]?.lectures?.[0]?.id;

  return { lecturesCount, hours, firstLectureId };
}

/** Maps a Prisma course row into a cacheable catalog item DTO. */
export function mapToPublicItem(
  course: DB_CourseCatalogItem,
): CourseCatalogPublicItem {
  const { lecturesCount, hours, firstLectureId } =
    computeListAggregates(course);
  const { rating, ratingCount } = computeRating(course.reviews ?? []);

  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    thumbnailUrl: course.thumbnailUrl,
    price: Number(course.price),
    compareAtPrice: course.compareAtPrice
      ? Number(course.compareAtPrice)
      : null,
    currency: course.currency,
    duration: course.duration,
    level: course.level,
    objectives: course.objectives,
    rating,
    ratingCount,
    lecturesCount,
    hours,
    firstLectureId,
    createdAt: prismaDateToIso(course.createdAt),
    updatedAt: prismaDateToIso(course.updatedAt),
    publishedAt: prismaDateToIsoNullable(course.publishedAt),
    status: course.status,
    visibility: course.visibility,
    instructorId: course.instructorId,
  };
}
