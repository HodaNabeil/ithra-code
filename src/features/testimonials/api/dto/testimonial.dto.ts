/**
 * Unified testimonial item returned by the API.
 * Can be sourced from admin-created testimonials or platform reviews.
 */
export type TestimonialItem = {
  id: string;
  source: 'testimonial' | 'review';
  name: string;
  avatarUrl: string | null;
  content: string;
  rating: number;
  createdAt: string;
};

/**
 * Pagination metadata for testimonial list responses.
 */
export type TestimonialPagination = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
};

/**
 * Query parameters for fetching testimonials.
 */
export type TestimonialQuery = {
  page: number;
  limit: number;
};

/**
 * Result returned by getTestimonials use-case.
 */
export type TestimonialResult = {
  items: TestimonialItem[];
  total: number;
  pagination: TestimonialPagination;
};
