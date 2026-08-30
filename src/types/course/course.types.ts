import {
  CourseLevel,
  CourseStatus,
  CourseVisibility,
  Currency,
} from '@/generated/prisma/enums';
import type { CourseDetailApiDTO } from '@/features/courses/course-detail/dto/course-detail.dto';
import type { CourseOverviewDTO } from '@/features/courses/course-overview/dto/course-overview.dto';
import type { CourseDetailDTO, CourseListDTO } from './course.dto';

/** Course detail returned by `getCourseDetail`. */
export type Course = CourseDetailApiDTO;

/** Overview stats returned by `getCourseOverview`. */
export type CourseOverview = CourseOverviewDTO;

// ── Shared Options ──────────────────────────────────────────────────

export type SortOption = 'newest' | 'oldest' | 'price_asc' | 'price_desc';

export const SORT_OPTIONS = [
  { label: 'الأحدث', value: 'newest' },
  { label: 'الأقدم', value: 'oldest' },
  { label: 'السعر: من الأقل إلى الأعلى', value: 'price_asc' },
  { label: 'السعر: من الأعلى إلى الأقل', value: 'price_desc' },
];

export type CategoryOption = string;

export const CATEGORY_OPTIONS = [{ label: 'الفئات', value: 'all' }];

export type ProgressOption = 'completed' | 'in_progress' | 'not_started';

export const PROGRESS_OPTIONS = [
  { label: 'التقدم', value: 'all' },
  { label: 'قيد التنفيذ', value: 'in_progress' },
  { label: 'لم يتم البدء', value: 'not_started' },
  { label: 'مكتمل', value: 'completed' },
];

export type Instructor = {
  id: string;
  name: string;
};

// ── Course Types ────────────────────────────────────────────────────

/**
 * For legacy compatibility and internal use.
 * In most UI cases, use CourseListDTO from @/types/course/course.dto
 */
export type CourseListItem = CourseListDTO;

export interface GetCoursesParams extends Record<string, unknown> {
  search?: string;
  page?: number;
  sort?: SortOption;
  path?: string;
  level?: CourseLevel;
  featured?: boolean;
  /** @deprecated Use `path` (learning path slug) instead. */
  category?: CategoryOption;
}

/** Paginated response returned by getCourses to the page. */
export interface GetCoursesResult {
  courses: CourseListDTO[];
  total: number;
  totalPages: number;
  currentPage: number;
}

/** Response returned by getCourseBySlug to the page loader. */
export interface GetCourseBySlugResult {
  data: {
    course: CourseDetailDTO;
  };
}

export type LoadCourseDetailResult =
  | { status: 'ok'; course: CourseDetailDTO }
  | { status: 'not_found' }
  | { status: 'error'; error: unknown };

/** Props accepted by the public CourseCard component. */
export type CourseCardProps = {
  course: CourseListDTO;
};

export { CourseLevel, CourseStatus, CourseVisibility, Currency };

export const levelCourse: Record<CourseLevel, string> = {
  BEGINNER: 'مبتدئ',
  INTERMEDIATE: 'متوسط',
  ADVANCED: 'متقدم',
  ALL_LEVELS: 'جميع المستويات',
};

// ── Student Course Types ─────────────────────────────────────────────

/**
 * Filter state for the student my-courses dashboard.
 * All values default to 'all' (no filter applied).
 */
export type StudentFilters = {
  category: string;
  progress: string;
  instructor: string;
};

export type StudentSortOption =
  | 'recent_access'
  | 'recent_enroll'
  | 'title_asc'
  | 'title_desc';

export interface GetMyCoursesParams {
  page?: number;
  search?: string;
  sort?: StudentSortOption;
  progressFilter?: string;
}

/** Paginated response returned by fetchEnrollments to the page. */
export interface GetMyCoursesResult {
  enrollments: EnrollmentItem[];
  allEnrollments: EnrollmentItem[];
  total: number;
  totalPages: number;
  currentPage: number;
}

/**
 * A student's enrollment with course progress, mapped from EnrollmentListItemDTO.
 */
export type EnrollmentItem = {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string;
  trackId: string | null;
  instructorId: string | null;
  progressPercentage: number;
  enrolledAt: Date;
  lastActivity: Date;
  firstLectureId?: string;
  lastLectureId?: string;
  lastLectureTitle?: string;
  instructor?: {
    firstName: string | null;
    lastName: string | null;
  } | null;
  [key: string]: unknown; // allow remaining Prisma fields to pass through
};

// ── Path Types ──────────────────────────────────────────────────────
