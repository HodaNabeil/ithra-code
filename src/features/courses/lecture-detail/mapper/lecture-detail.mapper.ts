import { LectureType } from '@prisma/client';

import type { CourseDetailApiDTO } from '@/features/courses/course-detail/dto/course-detail.dto';
import {
  prismaDateToIso,
  prismaDateToIsoNullable,
} from '@/features/courses/course-detail/mapper/shared';
import { isBunnyStreamConfigured, signBunnyHlsUrl } from '@/lib/bunny-stream';

import type {
  CourseRatingAggregate,
  GetLectureResponse,
  LectureDetailDTO,
} from '../dto/lecture-detail.dto';
import type { DB_LectureDetailCourseEntity } from '../repository/lecture-detail.select';
import type { DB_LectureDetailEntity } from '../repository/lecture-detail.select';

function resolveVideoHlsUrl(lecture: DB_LectureDetailEntity): string | null {
  if (lecture.type !== LectureType.VIDEO || !lecture.videoId) {
    return null;
  }

  const video = lecture.video;
  if (!video || video.status !== 'ready') {
    return null;
  }

  if (!isBunnyStreamConfigured()) {
    return null;
  }

  const hlsUrl = signBunnyHlsUrl({
    bunnyVideoId: video.bunnyVideoId,
    libraryId: video.libraryId,
  });

  if (!hlsUrl) {
    console.error(
      '[LECTURE_DETAIL] Bunny HLS signing failed for video',
      video.id,
    );
    return null;
  }

  return hlsUrl;
}

export function mapLectureToDTO(
  lecture: DB_LectureDetailEntity,
): LectureDetailDTO {
  return {
    id: lecture.id,
    sectionId: lecture.sectionId,
    title: lecture.title,
    description: lecture.description,
    type: lecture.type,
    content: lecture.content,
    videoId: lecture.videoId,
    videoHlsUrl: resolveVideoHlsUrl(lecture),
    position: lecture.position,
    isPublished: lecture.isPublished,
    isFree: lecture.isFree,
    createdAt: prismaDateToIso(lecture.createdAt),
    updatedAt: prismaDateToIso(lecture.updatedAt),
  };
}

export function mapLectureDetailCourseToApiDTO(
  course: DB_LectureDetailCourseEntity,
  isPurchased: boolean,
  ratingAggregate: CourseRatingAggregate,
): CourseDetailApiDTO {
  const hours = course.duration ? Math.round(course.duration / 60) : null;

  return {
    id: course.id,
    title: course.title,
    description: course.description,
    shortDescription: course.shortDescription,
    slug: course.slug,
    thumbnailUrl: course.thumbnailUrl,
    previewVideo: course.previewVideo,
    instructorId: course.instructorId,
    price: Number(course.price),
    compareAtPrice: course.compareAtPrice
      ? Number(course.compareAtPrice)
      : null,
    currency: course.currency,
    level: course.level,
    status: course.status,
    visibility: course.visibility,
    isFeatured: course.isFeatured,
    hours,
    requirements: course.requirements,
    objectives: course.objectives,
    targetAudience: course.targetAudience,
    tags: course.tags,
    prerequisiteIds: [],
    prerequisites: [],
    firstLectureId: undefined,
    lecturesCount: 0,
    sections: [],
    rating: ratingAggregate.rating,
    ratingCount: ratingAggregate.ratingCount,
    metaTitle: course.metaTitle,
    metaDescription: course.metaDescription,
    certificateEnabled: course.certificateEnabled,
    maxStudents: course.maxStudents,
    pathId: course.pathId,
    createdAt: prismaDateToIso(course.createdAt),
    updatedAt: prismaDateToIso(course.updatedAt),
    publishedAt: prismaDateToIsoNullable(course.publishedAt),
    isPurchased,
    isInCart: false,
  };
}

type MapGetLectureResponseInput = {
  lecture: DB_LectureDetailEntity;
  course: DB_LectureDetailCourseEntity;
  ratingAggregate: CourseRatingAggregate;
  hasPurchased: boolean;
  hasRated: boolean;
};

export function mapGetLectureResponse(
  input: MapGetLectureResponseInput,
): GetLectureResponse {
  return {
    lecture: mapLectureToDTO(input.lecture),
    course: mapLectureDetailCourseToApiDTO(
      input.course,
      input.hasPurchased,
      input.ratingAggregate,
    ),
    hasPurchased: input.hasPurchased,
    hasRated: input.hasRated,
  };
}
