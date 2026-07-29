// mappers/my-course.mapper.ts

import type { DB_MyCourseLectures } from '@/server/db/my-course.select';
import type {
  MyCourseLectureDetailsDTO,
  MyCourseLecturesDTO,
} from '@/types/my-courses/my-courses.dto';

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
        duration: lecture.video?.duration ?? 0,
        isCompleted: lecture.progress?.[0]?.isCompleted || false,
        attachmentsCount: lecture._count.attachments,
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
