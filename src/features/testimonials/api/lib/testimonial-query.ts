import type { TestimonialQuery } from '../dto/testimonial.dto';

export const TESTIMONIALS_DEFAULT_LIMIT = 10;
export const TESTIMONIALS_MAX_LIMIT = 50;

export type TestimonialSearchParamsInput = {
  page?: string;
  limit?: string;
};

/**
 * Parse and validate limit parameter.
 * - Minimum: 1
 * - Maximum: 50
 * - Default: 10
 */
function parseLimit(raw: string | undefined): number {
  const limit = Number(raw);
  if (!Number.isFinite(limit) || limit < 1) {
    return TESTIMONIALS_DEFAULT_LIMIT;
  }
  return Math.min(Math.floor(limit), TESTIMONIALS_MAX_LIMIT);
}

/**
 * Parse and validate page parameter.
 * - Minimum: 1
 * - Default: 1
 */
function parsePage(raw: string | undefined): number {
  const page = Number(raw);
  if (!Number.isFinite(page) || page < 1) {
    return 1;
  }
  return Math.floor(page);
}

/**
 * Parse search params into validated TestimonialQuery.
 */
export function parseTestimonialSearchParams(
  input: TestimonialSearchParamsInput,
): TestimonialQuery {
  return {
    page: parsePage(input.page),
    limit: parseLimit(input.limit),
  };
}
