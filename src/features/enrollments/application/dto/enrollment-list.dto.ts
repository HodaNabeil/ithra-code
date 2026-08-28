import type { CourseDetailPublicDTO } from '@/features/courses/course-detail/dto/course-detail.dto';
import type { OrderItemStatus } from '@prisma/client';

import type {
  EnrollmentListSortBy,
  EnrollmentListSortOrder,
  EnrollmentListStatusFilter,
} from '../constants';
import type { EnrollmentObject } from '../../domain/enrollment.entity';

export type EnrollmentCourseDTO = Omit<
  CourseDetailPublicDTO,
  'rating' | 'ratingCount'
>;

export type EnrollmentReviewDTO = {
  id: string;
  courseId: string;
  userId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EnrollmentProgressDTO = {
  totalLectures: number;
  completedLectures: number;
  totalTimeSpent: number;
  completionPercentage: number;
};

export type EnrollmentPurchaseDTO = {
  orderItemId: string | null;
  status: OrderItemStatus | null;
  refundStatus: string | null;
  refundedAt: string | null;
};

export type EnrollmentListItemDTO = {
  enrollment: EnrollmentObject;
  course: EnrollmentCourseDTO;
  review: EnrollmentReviewDTO | null;
  progress: EnrollmentProgressDTO;
  purchase: EnrollmentPurchaseDTO | null;
};

export type EnrollmentListPagination = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
};

export type EnrollmentListQuery = {
  page: number;
  limit: number;
  search?: string;
  sortBy: EnrollmentListSortBy;
  sortOrder: EnrollmentListSortOrder;
  status?: EnrollmentListStatusFilter;
};

export type EnrollmentListResult = {
  courses: EnrollmentListItemDTO[];
  pagination: EnrollmentListPagination;
};

export type ListStudentEnrollmentsInput = {
  studentId: string;
  query: EnrollmentListQuery;
};
