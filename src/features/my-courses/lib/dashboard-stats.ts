import type { EnrollmentItem } from '@/types/course/course.types';

export type ProgressStats = {
  learningHours: number;
  completedLessons: number;
  completedCourses: number;
};

export function deriveProgressStats(
  enrollments: EnrollmentItem[],
): ProgressStats {
  const completedCourses = enrollments.filter(
    (enrollment) => enrollment.progressPercentage === 100,
  ).length;

  const completedLessons = enrollments.reduce(
    (sum, enrollment) => sum + (enrollment.completedLectures ?? 0),
    0,
  );

  const totalTimeSeconds = enrollments.reduce(
    (sum, enrollment) => sum + (enrollment.totalTimeSpent ?? 0),
    0,
  );

  const learningHours = Number((totalTimeSeconds / 3600).toFixed(1));

  return {
    learningHours,
    completedLessons,
    completedCourses,
  };
}
