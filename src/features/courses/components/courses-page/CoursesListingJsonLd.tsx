import Script from 'next/script';
import type { CourseListDTO } from '@/types/course/course.dto';
import { getCourses } from '@/features/courses/services/course.service';
import {
  coursesPageQueryToGetCoursesParams,
  type CoursesPageQuery,
} from '@/features/courses/lib/courses-page-query';
import { buildCoursesItemListJsonLd } from '@/features/courses/lib/courses-item-list-jsonld';

type CoursesListingJsonLdProps = {
  query: CoursesPageQuery;
};

export async function CoursesListingJsonLd({
  query,
}: CoursesListingJsonLdProps) {
  let courses: CourseListDTO[] = [];

  try {
    const data = await getCourses(coursesPageQueryToGetCoursesParams(query));
    courses = data.courses;
  } catch {
    courses = [];
  }

  return (
    <Script
      id="courses-list-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(buildCoursesItemListJsonLd(courses)),
      }}
    />
  );
}
