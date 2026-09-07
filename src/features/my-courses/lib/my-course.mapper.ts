// mappers/my-course.mapper.ts

import type { GetCourseSectionsResponse } from '@/features/courses/course-sections/dto/course-sections.dto';
import type { MyCourseLecturesDTO } from '@/features/my-courses/dto/my-courses.dto';

export type LectureNavigationDTO = {
  prevLectureId: string | null;
  prevLectureTitle: string | null;
  prevLecturePosition: number | null;
  nextLectureId: string | null;
  nextLectureTitle: string | null;
  nextLecturePosition: number | null;
  courseSlug: string;
};

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

/**
 * Derives prev/next lecture navigation from course sections.
 */
export function mapLectureNavigationFromSections(
  response: GetCourseSectionsResponse,
  lectureId: string,
  courseSlug: string,
): LectureNavigationDTO {
  const allLectures = response.sections.flatMap((section) => section.lectures);
  const currentIndex = allLectures.findIndex((lecture) => lecture.id === lectureId);
  const prevLecture = allLectures[currentIndex - 1];
  const nextLecture = allLectures[currentIndex + 1];

  return {
    prevLectureId: prevLecture?.id ?? null,
    prevLectureTitle: prevLecture?.title ?? null,
    prevLecturePosition: prevLecture?.position ?? null,
    nextLectureId: nextLecture?.id ?? null,
    nextLectureTitle: nextLecture?.title ?? null,
    nextLecturePosition: nextLecture?.position ?? null,
    courseSlug,
  };
}
