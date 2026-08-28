import type { EnrollmentPurchaseDTO } from '../dto/enrollment-list.dto';

export interface EnrollmentOrderRefundReadRepository {
  findLatestByUserAndCourseIds(
    userId: string,
    courseIds: string[],
  ): Promise<Map<string, EnrollmentPurchaseDTO>>;
}
