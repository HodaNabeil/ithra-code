import type {
  CourseDetailDTO,
  CourseJsonLdFieldsDTO,
  CourseOutlineSliceDTO,
  CourseRequirementsSliceDTO,
  CourseSeoFieldsDTO,
  PrerequisiteDTO,
  ReviewDTO,
  SectionDTO,
} from '@/types/course/course.dto';
import { mapCourseListToDTO } from '@/features/courses/course-list/mapper/to-list-dto';
import type { DB_CourseDetailEntity } from '../repository/course-detail.select';
import { prismaDateToIso } from './shared';

export function mapSectionsFromDetailEntity(
  course: DB_CourseDetailEntity,
): SectionDTO[] {
  return (course.sections ?? []).map((section) => ({
    id: section.id,
    title: section.title,
    description: section.description,
    position: section.position,
    duration: Math.round(
      (section.lectures ?? []).reduce(
        (acc, lecture) => acc + (lecture.videoDuration || 0),
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

export function mapReviewsFromDetailEntity(
  course: DB_CourseDetailEntity,
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

export function mapPrerequisitesFromDetailEntity(
  course: DB_CourseDetailEntity,
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
    ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
    : 5;
}

/** Maps a Prisma course entity into the SSR page DTO. */
export function mapCourseDetailEntityToPageDTO(
  course: DB_CourseDetailEntity,
): CourseDetailDTO {
  const sections = mapSectionsFromDetailEntity(course);
  const totalDuration = sections.reduce(
    (acc, section) => acc + (section.duration || 0),
    0,
  );
  const lecturesCount = sections.reduce(
    (acc, section) => acc + (section.lectures?.length ?? 0),
    0,
  );
  const reviews = mapReviewsFromDetailEntity(course);
  const rating = aggregateRatingFromReviews(reviews);

  return {
    ...mapCourseListToDTO(course),
    previewVideo: course.previewVideo,
    duration: totalDuration,
    lecturesCount,
    sections,
    objectives: course.objectives,
    requirements: course.requirements,
    targetAudience: course.targetAudience,
    tags: course.tags,
    reviews,
    rating,
    prerequisites: mapPrerequisitesFromDetailEntity(course),
  };
}

export function mapEntityToSeoFields(
  course: DB_CourseDetailEntity,
): CourseSeoFieldsDTO {
  const base = mapCourseListToDTO(course);
  return {
    title: base.title,
    description: base.description,
    thumbnailUrl: base.thumbnailUrl,
  };
}

export function mapEntityToJsonLdFields(
  course: DB_CourseDetailEntity,
): CourseJsonLdFieldsDTO {
  const reviews = mapReviewsFromDetailEntity(course);

  return {
    title: course.title,
    description: course.description,
    price: Number(course.price),
    currency: course.currency,
    rating: aggregateRatingFromReviews(reviews),
    reviewCount: reviews.length,
  };
}

export function mapEntityToOutlineSlice(
  course: DB_CourseDetailEntity,
): CourseOutlineSliceDTO {
  return {
    slug: course.slug,
    sections: mapSectionsFromDetailEntity(course),
  };
}

export function mapEntityToRequirementsSlice(
  course: DB_CourseDetailEntity,
): CourseRequirementsSliceDTO {
  return {
    requirements: course.requirements,
    prerequisites: mapPrerequisitesFromDetailEntity(course),
  };
}
