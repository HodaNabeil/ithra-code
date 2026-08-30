import { useQuery } from '@tanstack/react-query';
import {
  getCourseSections,
  getLectureDetails,
  getLectureNavigation,
} from '../actions/my-course';
import { MY_COURSES_TAGS } from '@/lib/query-keys';

export function useCourseSections(courseSlug: string) {
  return useQuery({
    queryKey: MY_COURSES_TAGS.sections(courseSlug),
    queryFn: () => getCourseSections(courseSlug),
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
