import type { DB_CourseListItem } from '../repository/course-list.select';
import type { CourseListPublicItem } from '../dto/course-list.dto';
import type { CourseListDTO } from '@/types/course/course.dto';
import type { DB_CourseDetailEntity } from '@/features/courses/course-detail';
import {
  computeRating,
  prismaDateToIso,
  prismaDateToIsoNullable,
} from '@/features/courses/course-detail/mapper/shared';

type CourseRowForListMapping = DB_CourseListItem | DB_CourseDetailEntity;

function computeListAggregates(course: CourseRowForListMapping) {
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

/** Maps a Prisma course row into a cacheable list item DTO. */
export function mapToPublicItem(
  course: CourseRowForListMapping,
): CourseListPublicItem {
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

/** Maps a Prisma course row into the shared list/card DTO. */
export function mapCourseListToDTO(
  course: CourseRowForListMapping,
): CourseListDTO {
  const item = mapToPublicItem(course);

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
    isPurchased: false,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    publishedAt: item.publishedAt,
  };
}
