import type {
  CourseDetailPublicDTO,
  LectureApiDTO,
  PrerequisiteApiDTO,
  SectionApiDTO,
} from '../dto/course-detail.dto';
import type { DB_CourseDetailEntity } from '../repository/course-detail.select';
import {
  computeRating,
  prismaDateToIso,
  prismaDateToIsoNullable,
} from './shared';

function mapAttachments(
  attachments: DB_CourseDetailEntity['sections'][number]['lectures'][number]['attachments'],
): LectureApiDTO['attachments'] {
  return (attachments ?? []).map((attachment) => ({
    id: attachment.id,
    name: attachment.name,
    description: attachment.description,
    type: attachment.type,
    url: attachment.url,
    fileSize: attachment.fileSize,
    mimeType: attachment.mimeType,
    isDownloadable: attachment.isDownloadable,
    position: attachment.position,
    createdAt: prismaDateToIso(attachment.createdAt),
    updatedAt: prismaDateToIso(attachment.updatedAt),
  }));
}

function mapLectures(
  lectures: DB_CourseDetailEntity['sections'][number]['lectures'],
): LectureApiDTO[] {
  return (lectures ?? []).map((lecture) => ({
    id: lecture.id,
    sectionId: lecture.sectionId,
    title: lecture.title,
    description: lecture.description,
    type: lecture.type,
    attachments: mapAttachments(lecture.attachments),
    position: lecture.position,
    isPublished: lecture.isPublished,
    isFree: lecture.isFree,
    createdAt: prismaDateToIso(lecture.createdAt),
    updatedAt: prismaDateToIso(lecture.updatedAt),
  }));
}

function mapSections(course: DB_CourseDetailEntity): SectionApiDTO[] {
  return (course.sections ?? []).map((section) => ({
    id: section.id,
    courseId: section.courseId,
    title: section.title,
    description: section.description,
    position: section.position,
    isPublished: section.isPublished,
    createdAt: prismaDateToIso(section.createdAt),
    updatedAt: prismaDateToIso(section.updatedAt),
    lectures: mapLectures(section.lectures),
  }));
}

function mapPrerequisites(course: DB_CourseDetailEntity): PrerequisiteApiDTO[] {
  return (course.prerequisites ?? []).map((prerequisite) => {
    const { rating } = computeRating(prerequisite.reviews ?? []);

    return {
      id: prerequisite.id,
      title: prerequisite.title,
      slug: prerequisite.slug,
      thumbnailUrl: prerequisite.thumbnailUrl,
      price: Number(prerequisite.price),
      rating,
      level: prerequisite.level,
      duration: prerequisite.duration,
      studentCount: prerequisite._count.enrollments,
    };
  });
}

function computeHours(course: DB_CourseDetailEntity): number | null {
  const totalSeconds = (course.sections ?? []).reduce(
    (acc, section) =>
      acc +
      (section.lectures ?? []).reduce(
        (sum, lecture) => sum + (lecture.video?.duration ?? 0),
        0,
      ),
    0,
  );

  if (totalSeconds > 0) {
    return Math.round(totalSeconds / 3600);
  }

  return course.duration ? Math.round(course.duration / 60) : null;
}

/** Maps a Prisma course entity into a public, cache-safe API DTO. */
export function mapCourseDetailEntityToPublicDTO(
  course: DB_CourseDetailEntity,
): CourseDetailPublicDTO {
  const sections = mapSections(course);
  const prerequisites = mapPrerequisites(course);
  const { rating, ratingCount } = computeRating(course.reviews ?? []);
  const lecturesCount = sections.reduce(
    (acc, section) => acc + section.lectures.length,
    0,
  );
  const firstLectureId = sections[0]?.lectures[0]?.id;
  const hours = computeHours(course);

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
    prerequisiteIds: prerequisites.map((prerequisite) => prerequisite.id),
    prerequisites,
    firstLectureId,
    lecturesCount,
    sections,
    rating,
    ratingCount,
    metaTitle: course.metaTitle,
    metaDescription: course.metaDescription,
    certificateEnabled: course.certificateEnabled,
    maxStudents: course.maxStudents,
    pathId: course.pathId,
    createdAt: prismaDateToIso(course.createdAt),
    updatedAt: prismaDateToIso(course.updatedAt),
    publishedAt: prismaDateToIsoNullable(course.publishedAt),
  };
}
