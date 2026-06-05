// mappers/course.mapper.ts

import type {
  DB_CourseListItem,
  DB_CourseDetailItem,
} from '@/server/db/course.select';
import type {
  CourseListDTO,
  CourseDetailDTO,
  CourseSeoFieldsDTO,
  CourseJsonLdFieldsDTO,
  CourseHeroSliceDTO,
  CourseOutlineSliceDTO,
  CourseRequirementsSliceDTO,
  SectionDTO,
  ReviewDTO,
  PrerequisiteDTO,
} from '@/types/course/course.dto';

/** Next cache serialisation can turn Prisma `Date` fields into ISO strings. */
function prismaDateToIso(value: Date | string): string {
  return typeof value === 'string' ? value : value.toISOString();
}

function prismaDateToIsoNullable(
  value: Date | string | null | undefined,
): string | null {
  if (value == null) return null;
  return prismaDateToIso(value);
}

// ── List mapper — lightweight, for paginated card views ─────────────

/**
 * Maps a raw Prisma course row (list select)
 * into a serialisable CourseListDTO for the client.
 */
export function mapCourseListToDTO(course: DB_CourseListItem): CourseListDTO {
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

    createdAt: prismaDateToIso(course.createdAt),
    updatedAt: prismaDateToIso(course.updatedAt),
    publishedAt: prismaDateToIsoNullable(course.publishedAt),
  };
}

// ── Detail row helpers (shared section / review mapping) ────────────

export function mapSectionsFromDetailRow(
  course: DB_CourseDetailItem,
): SectionDTO[] {
  return (course.sections ?? []).map((section) => ({
    id: section.id,
    title: section.title,
    description: section.description,
    position: section.position,
    duration: Math.round(
      (section.lectures ?? []).reduce(
        (acc: number, lecture) => acc + (lecture.videoDuration || 0),
        0,
      ) / 60,
    ),
    lectures: (section.lectures ?? []).map((lecture) => ({
      id: lecture.id,
      title: lecture.title,
      description: lecture.description,
      type: lecture.type,
      videoDuration: lecture.videoDuration,
      muxPlaybackId: lecture.muxPlaybackId,
      position: lecture.position,
      isFree: lecture.isFree,
    })),
  }));
}

export function mapReviewsFromDetailRow(
  course: DB_CourseDetailItem,
): ReviewDTO[] {
  return (course.reviews ?? []).map((review) => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    createdAt: prismaDateToIso(review.createdAt),
    user: {
      id: review.user.id,
      firstName: review.user.firstName,
      lastName: review.user.lastName,
      profilePicture: review.user.profilePicture,
    },
  }));
}

export function mapPrerequisitesFromDetailRow(
  course: DB_CourseDetailItem,
): PrerequisiteDTO[] {
  return (course.prerequisites ?? []).map((pre) => ({
    id: pre.id,
    title: pre.title,
    slug: pre.slug,
    thumbnailUrl: pre.thumbnailUrl,
    price: Number(pre.price),
    currency: pre.currency,
    duration: pre.duration,
    description: pre.description,
  }));
}

function aggregateRatingFromReviews(reviews: ReviewDTO[]): number {
  return reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 5;
}

// ── Detail page slice mappers ───────────────────────────────────────

export function mapRowToSeoFields(
  course: DB_CourseDetailItem,
): CourseSeoFieldsDTO {
  const base = mapCourseListToDTO(course);
  return {
    title: base.title,
    description: base.description,
    thumbnailUrl: base.thumbnailUrl,
  };
}

export function mapRowToJsonLdFields(
  course: DB_CourseDetailItem,
): CourseJsonLdFieldsDTO {
  const reviews = mapReviewsFromDetailRow(course);

  return {
    title: course.title,
    description: course.description,
    price: Number(course.price),
    currency: course.currency,
    rating: aggregateRatingFromReviews(reviews),
    reviewCount: reviews.length,
  };
}

export function mapRowToHeroSlice(
  course: DB_CourseDetailItem,
): CourseHeroSliceDTO {
  const sections = mapSectionsFromDetailRow(course);
  const totalDuration = sections.reduce(
    (acc, section) => acc + (section.duration || 0),
    0,
  );
  const lecturesCount = sections.reduce(
    (acc, section) => acc + (section.lectures?.length ?? 0),
    0,
  );
  const firstLectureId = sections[0]?.lectures?.[0]?.id;

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    level: course.level,
    duration: totalDuration || null,
    lecturesCount,
    firstLectureId,
  };
}

export function mapRowToOutlineSlice(
  course: DB_CourseDetailItem,
): CourseOutlineSliceDTO {
  return {
    slug: course.slug,
    sections: mapSectionsFromDetailRow(course),
  };
}

export function mapRowToRequirementsSlice(
  course: DB_CourseDetailItem,
): CourseRequirementsSliceDTO {
  return {
    requirements: course.requirements,
    prerequisites: mapPrerequisitesFromDetailRow(course),
  };
}

// ── Detail mapper — full payload for the slug page ──────────────────

/**
 * Maps a raw Prisma course row (detail select)
 * into a serialisable CourseDetailDTO for the client.
 */
export function mapCourseDetailToDTO(
  course: DB_CourseDetailItem,
): CourseDetailDTO {
  const sections = mapSectionsFromDetailRow(course);
  const totalDuration = sections.reduce(
    (acc, section) => acc + (section.duration || 0),
    0,
  );
  const lecturesCount = sections.reduce(
    (acc, section) => acc + (section.lectures?.length ?? 0),
    0,
  );

  const reviews = mapReviewsFromDetailRow(course);
  const rating = aggregateRatingFromReviews(reviews);

  return {
    ...mapCourseListToDTO(course),
    duration: totalDuration,
    lecturesCount,
    sections,
    objectives: course.objectives,
    requirements: course.requirements,
    targetAudience: course.targetAudience,
    tags: course.tags,
    reviews,
    rating,

    prerequisites: mapPrerequisitesFromDetailRow(course),
  };
}
