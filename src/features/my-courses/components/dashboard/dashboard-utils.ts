import type { EnrollmentItem } from '@/types/course/course.types';

export type ProgressStats = {
  completedConcepts: number;
  learningHours: number;
  completedLessons: number;
  completedProjects: number;
};

export function pickContinueLearningEnrollment(
  enrollments: EnrollmentItem[],
): EnrollmentItem | null {
  if (enrollments.length === 0) return null;

  const inProgress = enrollments.filter(
    (enrollment) =>
      enrollment.progressPercentage > 0 && enrollment.progressPercentage < 100,
  );

  const pool = inProgress.length > 0 ? inProgress : enrollments;

  const sorted = [...pool].sort(
    (a, b) =>
      new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime(),
  );

  return sorted[0] ?? null;
}

export function deriveProgressStats(
  enrollments: EnrollmentItem[],
): ProgressStats {
  const activeEnrollments = enrollments.filter(
    (enrollment) => enrollment.progressPercentage > 0,
  );
  const completedEnrollments = enrollments.filter(
    (enrollment) => enrollment.progressPercentage === 100,
  );

  const estimatedLessons = enrollments.reduce(
    (sum, enrollment) =>
      sum + Math.max(1, Math.round(enrollment.progressPercentage / 10)),
    0,
  );

  return {
    completedConcepts:
      estimatedLessons + completedEnrollments.length * 2,
    learningHours: Number(
      (
        activeEnrollments.length * 0.3 +
        completedEnrollments.length * 1.2
      ).toFixed(1),
    ),
    completedLessons:
      activeEnrollments.length + completedEnrollments.length,
    completedProjects: completedEnrollments.length > 0 ? 1 : 0,
  };
}
