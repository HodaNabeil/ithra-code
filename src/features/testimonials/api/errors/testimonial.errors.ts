/**
 * Base error class for testimonial operations.
 */
export class TestimonialError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'TestimonialError';
  }
}

/**
 * Error thrown when a testimonial is not found.
 */
export class TestimonialNotFoundError extends TestimonialError {
  constructor(message = 'Testimonial not found') {
    super(message, 404);
    this.name = 'TestimonialNotFoundError';
  }
}

/**
 * Error thrown when testimonial validation fails.
 */
export class TestimonialValidationError extends TestimonialError {
  constructor(message = 'Invalid testimonial data') {
    super(message, 400);
    this.name = 'TestimonialValidationError';
  }
}
