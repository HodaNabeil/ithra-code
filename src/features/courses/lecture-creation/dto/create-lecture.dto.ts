import type { LectureType } from '@prisma/client';

export type CreateLectureBodyDTO = {
  title: string;
  description: string | null;
  type: LectureType;
};

export type CreateLectureOutputDTO = {
  id: string;
  sectionId: string;
  title: string;
  description: string | null;
  type: LectureType;
  content: string | null;
  videoId: string | null;
  position: number;
  isPublished: boolean;
  isFree: boolean;
};

export type CreateLectureResponseDTO = {
  lecture: CreateLectureOutputDTO;
};
