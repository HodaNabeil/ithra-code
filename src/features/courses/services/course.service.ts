import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/cache';

import {
  courseListSelect,
  courseDetailSelect,
} from '@/server/db/course.select';

import {
  mapCourseListToDTO,
  mapCourseDetailToDTO,
  mapRowToHeroSlice,
  mapRowToJsonLdFields,
  mapRowToOutlineSlice,
  mapRowToRequirementsSlice,
  mapRowToSeoFields,
} from '@/mappers/course.mapper';

import { COURSE_ORDER_BY } from '@/constant/course';
import { COURSE_TAGS } from '@/lib/query-keys';

import type { DB_CourseDetailItem } from '@/server/db/course.select';
import type {
  CourseDetailDTO,
  CourseHeroSliceDTO,
  CourseJsonLdFieldsDTO,
  CourseOutlineSliceDTO,
  CourseRequirementsSliceDTO,
  CourseSeoFieldsDTO,
} from '@/types/course/course.dto';
import type {
  GetCoursesResult,
  GetCoursesParams,
} from '@/types/course/course.types';

// ── Params ─────────────────────────────────────────────────────────
export type { GetCoursesParams };

// ────────────────────────────────────────────────────────────────────
// Cached core function (reusable)
// ────────────────────────────────────────────────────────────────────
const getCoursesCached = cache(
  async (params: GetCoursesParams): Promise<GetCoursesResult> => {
    const { search = '', sort = 'newest', path, level, featured, category } =
      params;
    const page = Number(params.page) || 1;
    const limit = 9;
    const pathSlug = path ?? category;

    const where = {
      title: {
        contains: search,
        mode: 'insensitive' as const,
      },
      ...(pathSlug && {
        path: { slug: pathSlug },
      }),
      ...(level && { level }),
      ...(featured && { isFeatured: true }),
    };

    const orderBy = COURSE_ORDER_BY[sort];

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: courseListSelect,
      }),
      prisma.course.count({ where }),
    ]);

    return {
      courses: courses.map(mapCourseListToDTO),
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  },
  // Dynamic cache key factory
  (params) =>
    [...COURSE_TAGS.course.list(params)].map((p) =>
      typeof p === 'string' ? p : JSON.stringify(p),
    ),
  {
    tags: [...COURSE_TAGS.course.lists()],
    revalidate: 60,
  },
);

// ── Public API ──────────────────────────────────────────────────────
export const getCourses = (params: GetCoursesParams) =>
  getCoursesCached(params);

// ────────────────────────────────────────────────────────────────────
// Single course detail row (shared cache for all slug-page slices)
// ────────────────────────────────────────────────────────────────────
const loadCourseDetailRowCached = cache(
  async (slug: string): Promise<DB_CourseDetailItem | null> => {
    return prisma.course.findUnique({
      where: { slug },
      select: courseDetailSelect,
    });
  },
  (slug) => [...COURSE_TAGS.course.detail(slug)],
  {
    tags: [...COURSE_TAGS.course.details()],
    revalidate: 60,
  },
);

/** Shared loader — memoised per slug; slice getters compose on top. */
export const loadCourseDetailRow = (slug: string) =>
  loadCourseDetailRowCached(slug);

export const getCourseBySlug = async (
  slug: string,
): Promise<CourseDetailDTO | null> => {
  const row = await loadCourseDetailRow(slug);
  return row ? mapCourseDetailToDTO(row) : null;
};

export const getCourseSeoFields = async (
  slug: string,
): Promise<CourseSeoFieldsDTO | null> => {
  const row = await loadCourseDetailRow(slug);
  return row ? mapRowToSeoFields(row) : null;
};

export const getCourseJsonLdFields = async (
  slug: string,
): Promise<CourseJsonLdFieldsDTO | null> => {
  const row = await loadCourseDetailRow(slug);
  return row ? mapRowToJsonLdFields(row) : null;
};

export const getCourseHeroSlice = async (
  slug: string,
): Promise<CourseHeroSliceDTO | null> => {
  const row = await loadCourseDetailRow(slug);
  return row ? mapRowToHeroSlice(row) : null;
};

export const getCourseObjectives = async (
  slug: string,
): Promise<string[] | null> => {
  const row = await loadCourseDetailRow(slug);
  return row ? row.objectives : null;
};

export const getCourseOutline = async (
  slug: string,
): Promise<CourseOutlineSliceDTO | null> => {
  const row = await loadCourseDetailRow(slug);
  return row ? mapRowToOutlineSlice(row) : null;
};

export const getCourseTargetAudience = async (
  slug: string,
): Promise<string[] | null> => {
  const row = await loadCourseDetailRow(slug);
  return row ? row.targetAudience : null;
};

export const getCourseRequirementsSlice = async (
  slug: string,
): Promise<CourseRequirementsSliceDTO | null> => {
  const row = await loadCourseDetailRow(slug);
  return row ? mapRowToRequirementsSlice(row) : null;
};

// ────────────────────────────────────────────────────────────────────
// Get all courses for sitemap
// ────────────────────────────────────────────────────────────────────

const getAllCoursesForSitemapCached = cache(
  async () => {
    return prisma.course.findMany({
      where: {
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    });
  },
  () => ['sitemap-courses'],
  {
    tags: [...COURSE_TAGS.course.all()],
    revalidate: 3600,
  },
);

export const getAllCoursesForSitemap = () => getAllCoursesForSitemapCached();
