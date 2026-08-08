import { CourseLevel } from '@/generated/prisma/enums';

export enum PathCategoryDTO {
  WEB = 'WEB',
  MOBILE = 'MOBILE',
  OTHER = 'OTHER',
}

export type TrackSummaryDTO = {
  id: string;
  title: string;
};

export type PathListDTO = {
  id: string;
  title: string;
  slug: string;
  tagline: string | null;
  summary: string | null;
  thumbnailUrl: string;
  category: PathCategoryDTO;
  icon: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  tracks: TrackSummaryDTO[];
};

export type CourseDetailDTO = {
  id: string;
  title: string;
  slug: string;
  thumbnailUrl: string;
  price: number;
  level: CourseLevel;
  hours: number | null;
};

export type TrackDetailDTO = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  thumbnailUrl: string | null;
  category: PathCategoryDTO;
  icon: string | null;
  courses: CourseDetailDTO[];
};

export type PathSectionDTO = {
  id: string;
  type: 'TITLE' | 'PARAGRAPH' | 'IMAGE' | 'BUTTON';
  content: string;
  order: number;
};

export type PathDetailDTO = Omit<PathListDTO, 'tracks'> & {
  description: string;
  metaTitle: string | null;
  metaDescription: string | null;
  tracks: TrackDetailDTO[];
  sections: PathSectionDTO[];
};
