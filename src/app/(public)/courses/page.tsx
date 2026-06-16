import { Metadata } from 'next';
import { ErrorRetry } from '@/components/shared/ErrorRetry';
import { CoursesListingJsonLd } from '@/features/courses/components/courses-page/CoursesListingJsonLd';
import { CoursesContainer } from '@/features/courses/components/courses-page/courses-container';
import { CoursesHero } from '@/features/courses/components/courses-hero';
import {
  parseCoursesPageSearchParams,
  coursesPageQueryToGetCoursesParams,
} from '@/features/courses/lib/courses-page-query';
import { buildCoursesListingMetadata } from '@/features/courses/lib/courses-listing-metadata';
import { getPublicPaths } from '@/features/learning-paths/services/path.queries';
import { getCourses } from '@/features/courses/services/course.service';
import type { CourseListDTO } from '@/types/course/course.dto';
import type { PathListDTO } from '@/types/path/path.dto';
import type { PaginationInfo } from '@/features/courses/components/courses-list';

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
  const query = parseCoursesPageSearchParams(await searchParams);
  return buildCoursesListingMetadata(query);
}

export default async function Courses({ searchParams }: CoursesPageProps) {
  const query = parseCoursesPageSearchParams(await searchParams);

  let courses: CourseListDTO[] = [];
  let paths: PathListDTO[] = [];
  let pagination: PaginationInfo | undefined;
  let hasError = false;

  // Fetch paths first (needed for filters).
  try {
    const pathsResponse = await getPublicPaths();
    paths = pathsResponse.paths;
  } catch {
    hasError = true;
  }

  // Fetch courses.
  try {
    const coursesResponse = await getCourses(
      coursesPageQueryToGetCoursesParams(query),
    );
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
      <CoursesListingJsonLd query={query} />

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
