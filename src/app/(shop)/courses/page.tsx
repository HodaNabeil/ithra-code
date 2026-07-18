import { Metadata } from 'next';
import { ErrorRetry } from '@/components/shared/ErrorRetry';
import { CoursesListingJsonLd } from '@/features/courses/components/courses-page/CoursesListingJsonLd';
import { CoursesContainer } from '@/features/courses/components/courses-page/courses-container';
import { CoursesHero } from '@/features/courses/components/courses-hero';
import { buildCoursesListingMetadata } from '@/features/courses/lib/courses-listing-metadata';
import { getPathsForFilters } from '@/features/learning-paths/api';
import { getCourses } from '@/features/courses/services/course.service';
import type { CourseListDTO } from '@/types/course/course.dto';
import type { PathListDTO } from '@/types/path/path.dto';
import type { PaginationInfo } from '@/features/courses/components/courses-list';
import type { SortOption } from '@/types/course/course.types';
import type { CourseLevel } from '@/generated/prisma/enums';

interface CoursesPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    sort?: string;
    path?: string;
    level?: string;
    featured?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: CoursesPageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const search = resolvedSearchParams.search || undefined;
  const path = resolvedSearchParams.path || undefined;

  return buildCoursesListingMetadata({ page, search, path });
}

export default async function Courses({ searchParams }: CoursesPageProps) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const search = resolvedSearchParams.search || undefined;
  const level = (resolvedSearchParams.level as CourseLevel) || undefined;
  const path = resolvedSearchParams.path || undefined;
  const sort = (resolvedSearchParams.sort as SortOption) || undefined;
  const featured =
    resolvedSearchParams.featured === 'true' ||
    resolvedSearchParams.featured === '1'
      ? true
      : undefined;

  let courses: CourseListDTO[] = [];
  let paths: PathListDTO[] = [];
  let pagination: PaginationInfo | undefined;
  let hasError = false;

  // Fetch paths first (needed for filters).

  try {
    paths = await getPathsForFilters();
  } catch {
    hasError = true;
  }

  // Fetch courses.
  try {
    const coursesResponse = await getCourses({
      page,
      search,
      level,
      path,
      sort,
      featured,
    });
    courses = coursesResponse.courses;
    pagination = {
      currentPage: coursesResponse.currentPage,
      totalPages: coursesResponse.totalPages,
    };
  } catch {
    hasError = true;
  }

  return (
    <>
      <CoursesListingJsonLd
        params={{ page, search, sort, level, path, featured }}
      />

      <main className="py-14 space-y-8">
        <CoursesHero />
        {!hasError && pagination && (
          <CoursesContainer
            courses={courses}
            paths={paths}
            pagination={pagination}
          />
        )}
        {hasError && <ErrorRetry />}
      </main>
    </>
  );
}
