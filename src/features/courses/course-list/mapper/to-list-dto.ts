import type { DB_CourseListItem } from '../repository/course-list.select';
import type { CourseListDTO } from '@/types/course/course.dto';
import {
  computeRating,
  prismaDateToIso,
  prismaDateToIsoNullable,
} from '@/features/courses/course-detail/mapper/shared';

function computeListAggregates(course: DB_CourseListItem) {
  const sections = course.sections ?? [];
  const lecturesCount = sections.reduce(
    (acc, section) => acc + (section.lectures?.length ?? 0),
    0,
  );
  const totalSeconds = sections.reduce(
    (acc, section) =>
      acc +
      (section.lectures ?? []).reduce(
        (sum, lecture) => sum + (lecture.videoDuration || 0),
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

/** Maps a Prisma course row into a serialisable list/card DTO. */
export function mapCourseListToDTO(course: DB_CourseListItem): CourseListDTO {
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
    isPurchased: false,
    createdAt: prismaDateToIso(course.createdAt),
    updatedAt: prismaDateToIso(course.updatedAt),
    publishedAt: prismaDateToIsoNullable(course.publishedAt),
  };
}
