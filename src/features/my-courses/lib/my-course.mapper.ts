// mappers/my-course.mapper.ts

import type { DB_MyCourseLectures } from '@/features/my-courses/repositories/my-course.select';
import type {
  MyCourseLectureDetailsDTO,
  MyCourseLecturesDTO,
} from '@/features/my-courses/dto/my-courses.dto';

/**
 * Maps a raw Prisma course row (my course lectures select)
 * into a serialisable MyCourseLecturesDTO for the client.
 */
export function mapMyCourseLecturesToDTO(
  course: DB_MyCourseLectures,
): MyCourseLecturesDTO {
  return {
    title: course.title,
    sections: course.sections.map((section) => ({
      id: section.id,
      title: section.title,
      position: section.position,
      lectures: section.lectures.map((lecture) => ({
        id: lecture.id,
        title: lecture.title,
        position: lecture.position,
        duration: lecture.video?.duration ?? 0,
        isCompleted: lecture.progress?.[0]?.isCompleted || false,
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
