import type {
  TestimonialItem,
  TestimonialQuery,
  TestimonialResult,
} from '../dto/testimonial.dto';
import {
  findActiveTestimonials,
  findQualifyingReviews,
  type RawReview,
  type RawTestimonial,
} from '../repository/testimonial.repository';

/**
 * Convert raw testimonial to unified DTO format.
 */
function mapTestimonialToDTO(raw: RawTestimonial): TestimonialItem {
  return {
    id: raw.id,
    source: 'testimonial',
    name: raw.name,
    avatarUrl: raw.avatarUrl,
    content: raw.content,
    rating: raw.rating,
    createdAt: raw.createdAt.toISOString(),
  };
}

/**
 * Convert raw review to unified DTO format.
 */
function mapReviewToDTO(raw: RawReview): TestimonialItem {
  return {
    id: raw.id,
    source: 'review',
    name: raw.user.name ?? 'Anonymous',
    avatarUrl: raw.user.image,
    content: raw.comment ?? '',
    rating: raw.rating,
    createdAt: raw.createdAt.toISOString(),
  };
}

/**
 * Main use-case: fetch testimonials and reviews, merge, sort, paginate.
 *
 * Business logic:
 * 1. Fetch active testimonials
 * 2. Fetch platform reviews with rating >= 4
 * 3. Convert both to unified format
 * 4. Merge into single array
 * 5. Sort by createdAt DESC (newest first)
 * 6. Apply pagination
 * 7. Return paginated result with metadata
 */
export async function getTestimonials(
  query: TestimonialQuery,
): Promise<TestimonialResult> {
  // Step 1 & 2: Fetch from both sources
  const [testimonials, reviews] = await Promise.all([
    findActiveTestimonials(),
    findQualifyingReviews(),
  ]);

  // Step 3 & 4: Convert and merge
  const testimonialItems = testimonials.map(mapTestimonialToDTO);
  const reviewItems = reviews.map(mapReviewToDTO);
  const merged = [...testimonialItems, ...reviewItems];

  // Step 5: Sort by createdAt DESC (newest first)
  merged.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const total = merged.length;

  // Step 6: Apply pagination
  const skip = (query.page - 1) * query.limit;
  const paginated = merged.slice(skip, skip + query.limit);

  // Step 7: Return with pagination metadata
  return {
    items: paginated,
    total,
    pagination: {
      currentPage: query.page,
      totalPages: Math.ceil(total / query.limit),
      totalItems: total,
      itemsPerPage: query.limit,
    },
  };
}
