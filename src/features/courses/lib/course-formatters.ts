import {
  levelCourse,
  type CourseLevel,
  type SortOption,
} from '@/types/course/course.types';
import type { SectionDTO } from '@/types/course/course.dto';

export const getFirstValue = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

export const isSortOption = (value: string | undefined): value is SortOption =>
  !!value && ['newest', 'oldest', 'price_asc', 'price_desc'].includes(value);

export function getCourseLevelsOptions() {
  return (Object.keys(levelCourse) as CourseLevel[]).map((value) => ({
    value,
    label: levelCourse[value],
  }));
}

export function formatCourseLevel(level: CourseLevel): string {
  return levelCourse[level] || level;
}

const courseLevelApiLabels: Record<CourseLevel, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  ALL_LEVELS: 'All Levels',
};

export function formatCourseLevelForApi(level: CourseLevel): string {
  return courseLevelApiLabels[level] || level;
}

export const totalDuration = (sections: SectionDTO[]) =>
  sections?.reduce((acc, section) => {
    return (
      acc +
      section.lectures.reduce((sum, lec) => sum + (lec.videoDuration || 0), 0)
    );
  }, 0);
