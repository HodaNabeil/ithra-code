import type { CourseForPurchase } from '../policies/course-purchase.policy';

export interface CourseRepository {
  findByIdForPurchase(courseId: string): Promise<CourseForPurchase | null>;
}
