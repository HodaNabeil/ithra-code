'use server';

import { getTestimonials } from '../api/use-cases/get-testimonials.use-case';
import type { TestimonialItem } from '../api/dto/testimonial.dto';

/**
 * Server action to fetch testimonials for display on pages.
 * Returns testimonials sorted by createdAt DESC.
 */
export async function getTestimonialsAction(params?: {
  page?: number;
  limit?: number;
}): Promise<{
  items: TestimonialItem[];
  total: number;
  success: boolean;
  error?: string;
}> {
  try {
    const result = await getTestimonials({
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
    });

    return {
      items: result.items,
      total: result.total,
      success: true,
    };
  } catch (error) {
    console.error('[GET_TESTIMONIALS_ACTION_ERROR]', error);
    return {
      items: [],
      total: 0,
      success: false,
      error: 'Failed to fetch testimonials',
    };
  }
}
