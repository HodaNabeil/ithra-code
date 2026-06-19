import type {
  CourseDetailPublicDTO,
  LessonApiDTO,
  PrerequisiteApiDTO,
  SectionApiDTO,
} from '../dto/course-detail.dto';
import type { DB_CourseDetailEntity } from '../repository/course-detail.select';
import {
  computeRating,
  formatInstructorName,
} from './shared';

function mapAttachments(
  attachments: DB_CourseDetailEntity['sections'][number]['lectures'][number]['attachments'],
): LessonApiDTO['attachments'] {
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
  }));
}

function mapLessons(
  lectures: DB_CourseDetailEntity['sections'][number]['lectures'],
): LessonApiDTO[] {
  return (lectures ?? []).map((lecture) => ({
    id: lecture.id,
    title: lecture.title,
    description: lecture.description,
    type: lecture.type,
    videoDuration: lecture.videoDuration,
    muxPlaybackId: lecture.muxPlaybackId,
    position: lecture.position,
    isFree: lecture.isFree,
    attachments: mapAttachments(lecture.attachments),
  }));
}

function mapSections(course: DB_CourseDetailEntity): SectionApiDTO[] {
  return (course.sections ?? []).map((section) => {
    const lessons = mapLessons(section.lectures);
    const sectionDurationSeconds = lessons.reduce(
      (acc, lesson) => acc + (lesson.videoDuration ?? 0),
      0,
    );

    return {
      id: section.id,
      title: section.title,
      description: section.description,
      position: section.position,
      duration:
        sectionDurationSeconds > 0
          ? Math.round(sectionDurationSeconds / 60)
          : null,
      lessons,
    };
  });
}

function mapPrerequisites(course: DB_CourseDetailEntity): PrerequisiteApiDTO[] {
  return (course.prerequisites ?? []).map((prerequisite) => ({
    id: prerequisite.id,
    title: prerequisite.title,
    slug: prerequisite.slug,
    thumbnailUrl: prerequisite.thumbnailUrl,
    price: Number(prerequisite.price),
    currency: prerequisite.currency,
    duration: prerequisite.duration,
    description: prerequisite.description,
  }));
}

function computeCurriculumStats(sections: SectionApiDTO[]): {
  lecturesCount: number;
  totalDuration: number | null;
} {
  const lecturesCount = sections.reduce(
    (acc, section) => acc + section.lessons.length,
    0,
  );
  const totalDurationMinutes = sections.reduce(
    (acc, section) => acc + (section.duration ?? 0),
    0,
  );

  return {
    lecturesCount,
    totalDuration: totalDurationMinutes > 0 ? totalDurationMinutes : null,
  };
}

/** Maps a Prisma course entity into a public, cache-safe API DTO. */
export function mapCourseDetailEntityToPublicDTO(
  course: DB_CourseDetailEntity,
): CourseDetailPublicDTO {
  const sections = mapSections(course);
  const { rating, ratingCount } = computeRating(course.reviews ?? []);
  const { lecturesCount, totalDuration } = computeCurriculumStats(sections);

  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    shortDescription: course.shortDescription,
    thumbnailUrl: course.thumbnailUrl,
    previewVideo: course.previewVideo,
    level: course.level,
    status: course.status,
    visibility: course.visibility,
    price: Number(course.price),
    compareAtPrice: course.compareAtPrice
      ? Number(course.compareAtPrice)
      : null,
    currency: course.currency,
    instructorId: course.instructorId,
    instructorName: formatInstructorName(
      course.instructor.firstName,
      course.instructor.lastName,
    ),
    instructorAvatar: course.instructor.profilePicture,
    rating,
    ratingCount,
    studentsCount: course._count.enrollments,
    lecturesCount,
    totalDuration: totalDuration ?? course.duration,
    sections,
    prerequisites: mapPrerequisites(course),
  };
}
