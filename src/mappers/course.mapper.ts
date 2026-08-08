export { mapCourseListToDTO } from '@/features/courses/course-list';

export {
  mapCourseDetailEntityToPageDTO as mapCourseDetailToDTO,
  mapEntityToJsonLdFields as mapRowToJsonLdFields,
  mapEntityToOutlineSlice as mapRowToOutlineSlice,
  mapEntityToRequirementsSlice as mapRowToRequirementsSlice,
  mapEntityToSeoFields as mapRowToSeoFields,
  mapPrerequisitesFromDetailEntity as mapPrerequisitesFromDetailRow,
  mapReviewsFromDetailEntity as mapReviewsFromDetailRow,
  mapSectionsFromDetailEntity as mapSectionsFromDetailRow,
} from '@/features/courses/course-detail';

import type { DB_CourseDetailEntity } from '@/features/courses/course-detail';
import { mapSectionsFromDetailEntity } from '@/features/courses/course-detail';
import type { CourseHeroSliceDTO } from '@/types/course/course.dto';

/** @deprecated Prefer composing from `mapCourseDetailEntityToPageDTO` */
export function mapRowToHeroSlice(
  course: DB_CourseDetailEntity,
): CourseHeroSliceDTO {
  const sections = mapSectionsFromDetailEntity(course);
  const totalDuration = sections.reduce(
    (acc, section) => acc + (section.duration || 0),
    0,
  );
  const lecturesCount = sections.reduce(
    (acc, section) => acc + (section.lectures?.length ?? 0),
    0,
  );
  const firstLectureId = sections[0]?.lectures?.[0]?.id;

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    level: course.level,
    duration: totalDuration || null,
    lecturesCount,
    firstLectureId,
    thumbnailUrl: course.thumbnailUrl,
    price: Number(course.price),
    compareAtPrice: course.compareAtPrice
      ? Number(course.compareAtPrice)
      : null,
    currency: course.currency,
  };
}
