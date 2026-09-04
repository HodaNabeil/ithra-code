export type ProgressRecordDTO = {
  id: string;
  enrollmentId: string;
  lectureId: string;
  isCompleted: boolean;
  completedAt: string | null;
  lastAccessedAt: string;
  timeSpent: number;
  createdAt: string;
  updatedAt: string;
};

export type UpdateLectureProgressResponse = {
  progress: ProgressRecordDTO;
};

export type GetLectureProgressResponse = {
  progress: ProgressRecordDTO | null;
};

export type ListCourseLectureProgressResponse = {
  progress: ProgressRecordDTO[];
  total: number;
};

export type UpdateLectureProgressBody = {
  isCompleted: boolean;
  incrementTime: number;
};
