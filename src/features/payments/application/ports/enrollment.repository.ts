/**
 * Persistence port for creating course enrollments during payment fulfillment.
 * One responsibility: grant ACTIVE access to purchased courses.
 */
export interface EnrollmentRepository {
  /**
   * Upserts ACTIVE enrollments for each course. Idempotent for retries.
   */
  createActiveEnrollments(
    studentId: string,
    courseIds: string[],
  ): Promise<void>;
}
