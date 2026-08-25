import { ZodError } from 'zod';
import { updateTestimonialSchema } from '../validation/testimonial.validation';
import {
  findTestimonialById,
  updateTestimonial,
} from '../repository/testimonial.repository';
import {
  TestimonialNotFoundError,
  TestimonialValidationError,
} from '../errors/testimonial.errors';

/**
 * Use-case: Update an existing testimonial (admin only).
 *
 * @throws TestimonialNotFoundError if testimonial doesn't exist
 * @throws TestimonialValidationError if validation fails
 */
export async function updateTestimonialUseCase(
  id: string,
  input: unknown,
): Promise<{ id: string }> {
  // Check if testimonial exists
  const existing = await findTestimonialById(id);
  if (!existing) {
    throw new TestimonialNotFoundError();
  }

  try {
    const validated = updateTestimonialSchema.parse(input);
    const testimonial = await updateTestimonial(id, validated);
    return { id: testimonial.id };
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues.map((e) => e.message).join(', ');
      throw new TestimonialValidationError(message);
    }
    throw error;
  }
}
