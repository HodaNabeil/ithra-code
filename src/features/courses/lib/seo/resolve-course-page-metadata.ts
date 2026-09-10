import type { Metadata } from 'next';

import type { CourseDetailApiDTO } from '@/features/courses/course-detail';
import {
  CourseDetailError,
  getCourseDetail,
} from '@/features/courses/course-detail';

import {
  buildCourseMetadataErrorMetadata,
  buildCourseNotFoundMetadata,
  buildCoursePageMetadata,
} from './course-page-metadata';

export async function resolveCoursePageMetadata(
  slug: string,
): Promise<Metadata> {
  try {
    const course: CourseDetailApiDTO = await getCourseDetail({
      courseIdOrSlug: slug,
    });
    return buildCoursePageMetadata(course);
  } catch (error: unknown) {
    if (error instanceof CourseDetailError && error.status === 404) {
      return buildCourseNotFoundMetadata();
    }
    return buildCourseMetadataErrorMetadata();
  }
}
