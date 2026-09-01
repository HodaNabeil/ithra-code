import { getCourses } from '@/features/courses/services/course.service';
import { getFaqsAction } from '@/features/faqs';
import { getTestimonialsAction } from '@/features/testimonials/actions/testimonials.actions';
import type { FaqItem } from '@/features/faqs';
import type { TestimonialItem } from '@/features/testimonials/api/dto/testimonial.dto';
import type { CourseListDTO } from '@/types/course/course.dto';

export type HomeDataResult<T> = {
  success: boolean;
  data: T;
  error?: string;
};

const HOME_FEATURED_COURSES_LIMIT = 6;
const HOME_TESTIMONIALS_LIMIT = 6;
const HOME_FAQS_LIMIT = 6;

export async function getFeaturedCoursesForHome(): Promise<
  HomeDataResult<{ courses: CourseListDTO[] }>
> {
  try {
    const result = await getCourses({ page: 1, featured: true });

    return {
      success: true,
      data: {
        courses: result.courses.slice(0, HOME_FEATURED_COURSES_LIMIT),
      },
    };
  } catch (error) {
    console.error('[HOME_FEATURED_COURSES_ERROR]', error);
    return {
      success: false,
      data: { courses: [] },
      error: 'فشل في جلب الدورات المميزة',
    };
  }
}

export async function getHomeTestimonials(): Promise<
  HomeDataResult<{ items: TestimonialItem[] }>
> {
  const result = await getTestimonialsAction({ limit: HOME_TESTIMONIALS_LIMIT });

  if (result.success) {
    return {
      success: true,
      data: { items: result.items },
    };
  }

  return {
    success: false,
    data: { items: [] },
    error: result.error ?? 'فشل في جلب آراء الطلاب',
  };
}

export async function getHomeFaqs(): Promise<
  HomeDataResult<{ items: FaqItem[] }>
> {
  const result = await getFaqsAction({ limit: HOME_FAQS_LIMIT });

  if (result.success) {
    return {
      success: true,
      data: { items: result.items },
    };
  }

  return {
    success: false,
    data: { items: [] },
    error: result.error ?? 'فشل في جلب الأسئلة الشائعة',
  };
}
