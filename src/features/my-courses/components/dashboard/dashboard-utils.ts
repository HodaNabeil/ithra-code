import type { StudentCourseItem } from '@/types/course/course.types';

export type ProgressStats = {
  completedConcepts: number;
  learningHours: number;
  completedLessons: number;
  completedProjects: number;
};

export function pickContinueLearningCourse(
  courses: StudentCourseItem[],
): StudentCourseItem | null {
  if (courses.length === 0) return null;

  const inProgress = courses.filter(
    (course) =>
      course.progressPercentage > 0 && course.progressPercentage < 100,
  );

  const pool = inProgress.length > 0 ? inProgress : courses;

  const sorted = [...pool].sort(
    (a, b) =>
      new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime(),
  );

  return sorted[0] ?? null;
}

export function deriveProgressStats(
  courses: StudentCourseItem[],
): ProgressStats {
  const activeCourses = courses.filter(
    (course) => course.progressPercentage > 0,
  );
  const completedCourses = courses.filter(
    (course) => course.progressPercentage === 100,
  );

  const estimatedLessons = courses.reduce(
    (sum, course) => sum + Math.max(1, Math.round(course.progressPercentage / 10)),
    0,
  );

  return {
    completedConcepts: estimatedLessons + completedCourses.length * 2,
    learningHours: Number((activeCourses.length * 0.3 + completedCourses.length * 1.2).toFixed(1)),
    completedLessons: activeCourses.length + completedCourses.length,
    completedProjects: completedCourses.length > 0 ? 1 : 0,
  };
}
