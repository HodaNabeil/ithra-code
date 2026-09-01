/** Thrown by enrollment use-cases; route handler maps `status` to HTTP. */
export class EnrollmentError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'EnrollmentError';
  }
}

export class EnrollmentValidationError extends EnrollmentError {
  constructor(message = 'بيانات الطلب غير صالحة') {
    super(400, message, 'VALIDATION_ERROR');
    this.name = 'EnrollmentValidationError';
  }
}

export const ENROLLMENTS_FETCHED_MESSAGE = 'تم جلب التسجيلات بنجاح';
