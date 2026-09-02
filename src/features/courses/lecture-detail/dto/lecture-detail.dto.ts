import type { LectureType } from '@prisma/client';

import type { CourseDetailApiDTO } from '@/features/courses/course-detail/dto/course-detail.dto';

export type LectureDetailViewer = {
  id: string;
  role: string;
};

export type LectureDetailEnrollment = {
  id: string;
};

export type CourseRatingAggregate = {
  rating: number;
  ratingCount: number;
};

export type LectureDetailCourseIdentity = {
  id: string;
  instructorId: string;
  status: string;
};

export type LectureDetailDTO = {
  id: string;
  sectionId: string;
  title: string;
  description: string | null;
  type: LectureType;
  content: string | null;
  videoId: string | null;
  videoHlsUrl: string | null;
  position: number;
  isPublished: boolean;
  isFree: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GetLectureResponse = {
  lecture: LectureDetailDTO;
  course: CourseDetailApiDTO;
  hasPurchased: boolean;
  hasRated: boolean;
};
