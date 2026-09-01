import type { MyCourseSectionDTO } from '@/features/my-courses/dto/my-courses.dto';

export type CourseProgressMetrics = {
  completedCount: number;
  totalCount: number;
  percentage: number;
};

export function progressPercentage(
  completedCount: number,
  totalCount: number,
): number {
  if (totalCount <= 0) return 0;
  return (completedCount / totalCount) * 100;
}

export function getCourseProgressMetrics(
  sections: MyCourseSectionDTO[],
): CourseProgressMetrics {
  let completedCount = 0;
  let totalCount = 0;

  for (const section of sections) {
    for (const lecture of section.lectures) {
      totalCount++;
      if (lecture.isCompleted) completedCount++;
    }
  }

  return {
    completedCount,
    totalCount,
    percentage: progressPercentage(completedCount, totalCount),
  };
}

export type SectionLectureSummary = {
  durationLabel: string;
  completedCount: number;
  lectureCount: number;
};
