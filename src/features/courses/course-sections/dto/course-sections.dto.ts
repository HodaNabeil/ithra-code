import type { AttachmentType, CourseStatus, LectureType } from '@prisma/client';

export type LectureProgressDTO = {
  isCompleted: boolean;
  timeSpent: number;
  lastAccessedAt: string | null;
  completedAt: string | null;
};

export type VideoDTO = {
  id: string;
  bunnyVideoId: string;
  libraryId: string;
  status: string;
  duration: number | null;
  thumbnailUrl: string | null;
  hlsUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type AttachmentDTO = {
  id: string;
  name: string;
  type: AttachmentType;
  url: string;
  isDownloadable: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type LectureDTO = {
  id: string;
  title: string;
  description: string | null;
  type: LectureType;
  videoDuration: number | null;
  position: number;
  isPublished: boolean;
  isFree: boolean;
  video?: VideoDTO;
  attachments: AttachmentDTO[];
  progress?: LectureProgressDTO | null;
};

export type SectionStatisticsDTO = {
  totalLectures: number;
  totalDuration: number;
  completedLectures: number;
};

export type SectionWithStatsDTO = {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  position: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  lectures: LectureDTO[];
  statistics: SectionStatisticsDTO;
};

export type GetCourseSectionsResponse = {
  sections: SectionWithStatsDTO[];
  total: number;
};

export type CourseSectionsCacheScope = 'public' | 'staff';

export type CourseSectionsIdentity = {
  id: string;
  slug: string;
  instructorId: string;
  status: CourseStatus;
};

export type CourseSectionsViewer = {
  id: string;
  role?: string;
} | null;

export type CourseSectionsEnrollment = {
  id: string;
  status: string;
};

export type CourseSectionsProgressRecord = {
  lectureId: string;
  isCompleted: boolean;
  timeSpent: number;
  lastAccessedAt: Date;
  completedAt: Date | null;
};
