// DTOs
export type {
  TestimonialItem,
  TestimonialPagination,
  TestimonialQuery,
  TestimonialResult,
} from './dto/testimonial.dto';

// Errors
export {
  TestimonialError,
  TestimonialNotFoundError,
  TestimonialValidationError,
} from './errors/testimonial.errors';

// Query parsing
export {
  parseTestimonialSearchParams,
  TESTIMONIALS_DEFAULT_LIMIT,
  TESTIMONIALS_MAX_LIMIT,
} from './lib/testimonial-query';
export type { TestimonialSearchParamsInput } from './lib/testimonial-query';

// Use cases
export { getTestimonials } from './use-cases/get-testimonials.use-case';
export { createTestimonialUseCase } from './use-cases/create-testimonial.use-case';
export { updateTestimonialUseCase } from './use-cases/update-testimonial.use-case';
export { deleteTestimonialUseCase } from './use-cases/delete-testimonial.use-case';

// Validation
export {
  createTestimonialSchema,
  updateTestimonialSchema,
} from './validation/testimonial.validation';
export type {
  CreateTestimonialInput,
  UpdateTestimonialInput,
} from './validation/testimonial.validation';
