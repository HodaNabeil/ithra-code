import type {
  CourseLevel,
  CourseStatus,
  CourseVisibility,
  Currency,
  EnrollmentStatus,
} from '@prisma/client';

export type AttachmentApiDTO = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  url: string;
  fileSize: number | null;
  mimeType: string | null;
  isDownloadable: boolean;
  position: number;
};

export type LessonApiDTO = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  videoDuration: number | null;
  muxPlaybackId: string | null;
  position: number;
  isFree: boolean;
  attachments: AttachmentApiDTO[];
};

export type SectionApiDTO = {
  id: string;
  title: string;
  description: string | null;
  position: number;
  duration: number | null;
  lessons: LessonApiDTO[];
};

export type PrerequisiteApiDTO = {
  id: string;
  title: string;
  slug: string;
  thumbnailUrl: string;
  price: number;
  currency: Currency;
  duration: number | null;
  description: string;
};

/** Public course shape cached in Redis (no user-specific fields). */
export type CourseDetailPublicDTO = {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  thumbnailUrl: string;
  previewVideo: string | null;
  level: CourseLevel;
  status: CourseStatus;
  visibility: CourseVisibility;
  price: number;
  compareAtPrice: number | null;
  currency: Currency;
  instructorId: string;
  instructorName: string;
  instructorAvatar: string | null;
  rating: number;
  ratingCount: number;
  studentsCount: number;
  lecturesCount: number;
  totalDuration: number | null;
  sections: SectionApiDTO[];
  prerequisites: PrerequisiteApiDTO[];
};

/** Full API response shape including user-specific fields. */
export type CourseDetailApiDTO = CourseDetailPublicDTO & {
  isPurchased: boolean;
  isInCart: boolean;
  enrollmentStatus: EnrollmentStatus | null;
};

export type UserCourseSignals = {
  isPurchased: boolean;
  isInCart: boolean;
  enrollmentStatus: EnrollmentStatus | null;
};

export type GetCourseDetailResponse = {
  course: CourseDetailApiDTO;
};
