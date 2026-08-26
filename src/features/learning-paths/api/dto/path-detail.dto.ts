import type { CourseLevel } from '@prisma/client';
import type { PathCategoryDTO } from '@/types/path/path.dto';

export type PathDetailCourseItem = {
  id: string;
  title: string;
  slug: string;
  thumbnailUrl: string;
  price: number;
  level: CourseLevel;
  hours: number | null;
};

export type PathDetailTrackItem = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  thumbnailUrl: string | null;
  category: PathCategoryDTO;
  icon: string | null;
  courses: PathDetailCourseItem[];
};

export type PathDetailSectionItem = {
  id: string;
  type: 'TITLE' | 'PARAGRAPH' | 'IMAGE' | 'BUTTON';
  content: string;
  order: number;
};

export type PathDetailItem = {
  id: string;
  title: string;
  slug: string;
  tagline: string | null;
  summary: string | null;
  description: string;
  thumbnailUrl: string;
  category: PathCategoryDTO;
  icon: string | null;
  isPublished: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
  tracks: PathDetailTrackItem[];
  sections: PathDetailSectionItem[];
};

export type PathDetailResult = {
  path: PathDetailItem;
};
