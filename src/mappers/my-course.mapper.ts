// mappers/my-course.mapper.ts

import type { DB_MyCourseLectures } from '@/server/db/my-course.select';
import type { MyCourseLecturesDTO } from '@/types/my-courses/my-courses.dto';

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
