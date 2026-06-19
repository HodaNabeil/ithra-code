import type { AddToCartCourse } from '@/features/courses/components/add-to-cart-button';
import { resolveCourseEnrollmentState } from '@/features/courses/services/user-course-signals.service';
import type { CourseDetailDTO } from '@/types/course/course.dto';

export type { CourseEnrollmentState } from '@/features/courses/services/user-course-signals.service';

export { resolveCourseEnrollmentState };

export function buildAddToCartCourse(
  course: CourseDetailDTO,
  enrollmentState: Awaited<ReturnType<typeof resolveCourseEnrollmentState>>,
): AddToCartCourse {
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    thumbnailUrl: course.thumbnailUrl,
    price: course.price,
    compareAtPrice: course.compareAtPrice,
    currency: course.currency,
    duration: course.duration,
    level: course.level,
    objectives: course.objectives,
    rating: course.rating,
    ratingCount: course.ratingCount,
    lecturesCount: course.lecturesCount,
    hours: course.hours,
    firstLectureId: course.firstLectureId,
    isPurchased: enrollmentState.isEnrolled,
    isInCart: enrollmentState.isInCart,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
    publishedAt: course.publishedAt,
  };
}
