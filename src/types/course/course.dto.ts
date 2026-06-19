import type { Currency } from '@prisma/client';

// types/course/course.dto.ts

// ── Shared sub-types ────────────────────────────────────────────────

export type SectionDTO = {
  id: string;
  title: string;
  description: string | null;
  duration: number | null;
  position: number;
  lectures: LectureDTO[];
};

export type LectureDTO = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  videoDuration: number | null;
  muxPlaybackId: string | null;
  position: number;
  isFree: boolean;
};

export type PrerequisiteDTO = {
  id: string;
  title: string;
  slug: string;
  thumbnailUrl: string;
  price: number;
  currency: Currency;
  duration: number | null;
  description: string;
};

export type ReviewDTO = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profilePicture: string | null;
  };
};

// ── CourseListDTO — lightweight, used in paginated lists ─────────────

/** Serialisable course shape for list / card views (no heavy relations). */
export type CourseListDTO = {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string;

  price: number;
  compareAtPrice: number | null;
  currency: Currency;
  duration: number | null;
  level: string;

  objectives: string[];
  rating: number;
  ratingCount: number;
  lecturesCount: number;
  hours: number | null;
  firstLectureId?: string;
  isPurchased?: boolean;
  isInCart?: boolean;

  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

// ── CourseDetailDTO — full detail page payload ──────────────────────

/** Extended course shape for the detail / slug page. */
export type CourseDetailDTO = CourseListDTO & {
  requirements: string[];
  targetAudience: string[];
  tags: string[];

  sections: SectionDTO[];
  prerequisites: PrerequisiteDTO[];
  reviews: ReviewDTO[];
};

// ── Detail page slices (narrow shapes per UI concern) ───────────────

export type CourseSeoFieldsDTO = Pick<
  CourseListDTO,
  'title' | 'description' | 'thumbnailUrl'
>;

export type CourseJsonLdFieldsDTO = {
  title: string;
  description: string;
  price: number;
  currency: Currency;
  rating: number;
  reviewCount: number;
};

export type CourseHeroSliceDTO = {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: string;
  duration: number | null;
  lecturesCount: number;
  firstLectureId: string | undefined;
  thumbnailUrl: string;
  price: number;
  compareAtPrice: number | null;
  currency: CourseListDTO['currency'];
};

export type CourseOutlineSliceDTO = {
  slug: string;
  sections: SectionDTO[];
};

export type CourseRequirementsSliceDTO = {
  requirements: string[];
  prerequisites: PrerequisiteDTO[];
};
