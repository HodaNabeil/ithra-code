export const ZERO_ENROLLMENT_PROGRESS = {
  totalLectures: 0,
  completedLectures: 0,
  totalTimeSpent: 0,
  completionPercentage: 0,
  lastAccessedAt: null,
} as const;

export function computeCompletionPercentage(
  completedLectures: number,
  totalLectures: number,
): number {
  if (totalLectures <= 0) {
    return 0;
  }

  return Math.round((completedLectures / totalLectures) * 10000) / 100;
}
