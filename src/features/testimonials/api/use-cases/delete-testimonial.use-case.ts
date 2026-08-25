import {
  deleteTestimonial,
  findTestimonialById,
} from '../repository/testimonial.repository';
import { TestimonialNotFoundError } from '../errors/testimonial.errors';

/**
 * Use-case: Delete a testimonial (admin only).
 *
 * @throws TestimonialNotFoundError if testimonial doesn't exist
 */
export async function deleteTestimonialUseCase(id: string): Promise<void> {
  // Check if testimonial exists
  const existing = await findTestimonialById(id);
  if (!existing) {
    throw new TestimonialNotFoundError();
  }

  await deleteTestimonial(id);
}
