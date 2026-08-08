import Script from 'next/script';
import type { CourseListDTO } from '@/types/course/course.dto';
import { getCourses } from '@/features/courses/services/course.service';
import { buildCoursesItemListJsonLd } from '@/features/courses/lib/courses-item-list-jsonld';
import type { GetCoursesParams } from '@/types/course/course.types';

type CoursesListingJsonLdProps = {
  params: GetCoursesParams;
};

export async function CoursesListingJsonLd({
  params,
}: CoursesListingJsonLdProps) {
  let courses: CourseListDTO[] = [];

  try {
    const data = await getCourses(params);
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
