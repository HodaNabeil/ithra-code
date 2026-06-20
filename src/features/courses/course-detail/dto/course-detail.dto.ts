import type {
  AttachmentType,
  CourseLevel,
  CourseStatus,
  CourseVisibility,
  Currency,
  EnrollmentStatus,
  LectureType,
} from '@prisma/client';

export type AttachmentApiDTO = {
  id: string;
  name: string;
  description: string | null;
  type: AttachmentType;
  url: string;
  fileSize: number | null;
  mimeType: string | null;
  isDownloadable: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type LectureApiDTO = {
  id: string;
  sectionId: string;
  title: string;
  description: string | null;
  type: LectureType;
  attachments: AttachmentApiDTO[];
  position: number;
  isPublished: boolean;
  isFree: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SectionApiDTO = {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  position: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  lectures: LectureApiDTO[];
};

export type PrerequisiteApiDTO = {
  id: string;
  title: string;
  slug: string;
  thumbnailUrl: string;
  price: number;
  rating: number;
  level: CourseLevel;
  duration: number | null;
  studentCount: number;
};

/** Public course shape cached in Redis (no user-specific fields). */
export type CourseDetailPublicDTO = {
  id: string;
  title: string;
  description: string;
  shortDescription: string | null;
  slug: string;
  thumbnailUrl: string;
  previewVideo: string | null;
  instructorId: string;
  price: number;
  compareAtPrice: number | null;
  currency: Currency;
  level: CourseLevel;
  status: CourseStatus;
  visibility: CourseVisibility;
  isFeatured: boolean;
  hours: number | null;
  requirements: string[];
  objectives: string[];
  targetAudience: string[];
  tags: string[];
  prerequisiteIds: string[];
  prerequisites: PrerequisiteApiDTO[];
  firstLectureId: string | undefined;
  lecturesCount: number;
  sections: SectionApiDTO[];
  rating: number;
  ratingCount: number;
  metaTitle: string | null;
  metaDescription: string | null;
  certificateEnabled: boolean;
  maxStudents: number | null;
  pathId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

/** Full API response shape including user-specific fields. */
export type CourseDetailApiDTO = CourseDetailPublicDTO & {
  isPurchased: boolean;
  isInCart: boolean;
};

export type UserCourseSignals = {
  isPurchased: boolean;
  isInCart: boolean;
  enrollmentStatus: EnrollmentStatus | null;
};

export type GetCourseDetailResponse = {
  course: CourseDetailApiDTO;
};

/** @deprecated Use LectureApiDTO */
export type LessonApiDTO = LectureApiDTO;
