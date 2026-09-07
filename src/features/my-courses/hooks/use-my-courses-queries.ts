import { useQuery } from '@tanstack/react-query';
import { getCourseProgressClient } from '@/features/courses/course-progress/api/get-course-progress.client';
import { getCourseSectionsClient } from '@/features/courses/course-sections/api/get-course-sections.client';
import { getLectureClient } from '@/features/courses/lecture-detail/api/get-lecture.client';
import { mapCourseSectionsResponseToMyCourseLectures } from '@/features/my-courses/lib/my-course.mapper';
import { getLectureDetails, getLectureNavigation } from '../actions/my-course';
import {
  COURSE_PROGRESS_TAGS,
  LECTURE_DETAIL_TAGS,
  MY_COURSES_TAGS,
} from '@/lib/query-keys';

export function useCourseSections(courseSlug: string) {
  return useQuery({
    queryKey: MY_COURSES_TAGS.sections(courseSlug),
    queryFn: async () => {
      const response = await getCourseSectionsClient(courseSlug);
      return mapCourseSectionsResponseToMyCourseLectures(response);
    },
    enabled: !!courseSlug,
  });
}

export function useLectureDetailQuery(lectureId: string) {
  return useQuery({
    queryKey: LECTURE_DETAIL_TAGS.detail(lectureId),
    queryFn: () => getLectureClient(lectureId),
    enabled: !!lectureId,
  });
}

export function useCourseProgressQuery(courseSlug: string) {
  return useQuery({
    queryKey: COURSE_PROGRESS_TAGS.detail(courseSlug),
    queryFn: () => getCourseProgressClient(courseSlug),
    enabled: !!courseSlug,
  });
}

export function useLectureDetails(lectureId: string, courseSlug: string) {
  return useQuery({
    queryKey: MY_COURSES_TAGS.lecture(lectureId, courseSlug),
    queryFn: () => getLectureDetails(lectureId, courseSlug),
    enabled: !!lectureId && !!courseSlug,
  });
}

export function useLectureNavigation(lectureId: string, courseSlug: string) {
  return useQuery({
    queryKey: MY_COURSES_TAGS.navigation(lectureId, courseSlug),
    queryFn: () => getLectureNavigation(lectureId, courseSlug),
    enabled: !!lectureId && !!courseSlug,
  });
}
