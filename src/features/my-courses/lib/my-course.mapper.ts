// mappers/my-course.mapper.ts

import type { GetCourseSectionsResponse } from '@/features/courses/course-sections/dto/course-sections.dto';
import type {
  MyCourseLectureDetailsDTO,
  MyCourseLecturesDTO,
} from '@/features/my-courses/dto/my-courses.dto';

/**
 * Maps a raw Prisma course row (my course lectures select)
 * into a serialisable MyCourseLecturesDTO for the client.
 */
export function mapCourseSectionsResponseToMyCourseLectures(
  response: GetCourseSectionsResponse,
): MyCourseLecturesDTO {
  return {
    title: '',
    sections: response.sections.map((section) => ({
      id: section.id,
      title: section.title,
      position: section.position,
      lectures: section.lectures.map((lecture) => ({
        id: lecture.id,
        title: lecture.title,
        position: lecture.position,
        duration: lecture.videoDuration ?? lecture.video?.duration ?? 0,
        isCompleted: lecture.progress?.isCompleted ?? false,
        attachments: lecture.attachments.map((attachment) => ({
          id: attachment.id,
          name: attachment.name,
          url: attachment.url,
        })),
        attachmentsCount: lecture.attachments.length,
      })),
    })),
  };
}

type LectureDetailsEntity = {
  id: string;
  title: string;
  description: string | null;
  updatedAt: Date;
  section: {
    course: {
      slug: string;
      sections: Array<{
        lectures: Array<{ id: string }>;
      }>;
    };
  };
};

/**
 * Maps lecture query result into a serialisable DTO (no Prisma Decimal/Date objects).
 */
export function mapLectureDetailsToDTO(
  lecture: LectureDetailsEntity,
  lectureId: string,
): MyCourseLectureDetailsDTO {
  const allLectures = lecture.section.course.sections.flatMap(
    (section) => section.lectures,
  );
  const currentIndex = allLectures.findIndex((l) => l.id === lectureId);
  const nextLecture = allLectures[currentIndex + 1];

  return {
    lecture: {
      id: lecture.id,
      title: lecture.title,
      description: lecture.description,
      updatedAt: lecture.updatedAt.toISOString(),
    },
    nextLectureId: nextLecture?.id ?? null,
    courseSlug: lecture.section.course.slug,
  };
}
