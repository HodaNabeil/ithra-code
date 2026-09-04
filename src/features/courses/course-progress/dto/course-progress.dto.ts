export type CourseProgressDTO = {
  totalLectures: number;
  completedLectures: number;
  completionPercentage: number;
  totalTimeSpent: number;
  lastAccessedAt: string | null;
};
