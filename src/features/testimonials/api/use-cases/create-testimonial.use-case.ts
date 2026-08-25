import { ZodError } from 'zod';
import { createTestimonialSchema } from '../validation/testimonial.validation';
import { createTestimonial } from '../repository/testimonial.repository';
import { TestimonialValidationError } from '../errors/testimonial.errors';

/**
 * Use-case: Create a new testimonial (admin only).
 *
 * @throws TestimonialValidationError if validation fails
 */
export async function createTestimonialUseCase(
  input: unknown,
): Promise<{ id: string }> {
  try {
    const validated = createTestimonialSchema.parse(input);
    const testimonial = await createTestimonial(validated);
    return { id: testimonial.id };
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues.map((e) => e.message).join(', ');
      throw new TestimonialValidationError(message);
    }
    throw error;
  }
}
