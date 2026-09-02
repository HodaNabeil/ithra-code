import { z } from '@/lib/zod-openapi';

export const enrollmentObjectSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  courseId: z.string(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'DROPPED', 'REVOKED']),
  enrolledAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const attachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  type: z.string(),
  url: z.string(),
  fileSize: z.number().int().nullable(),
  mimeType: z.string().nullable(),
  isDownloadable: z.boolean(),
  position: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const lectureSchema = z.object({
  id: z.string(),
  sectionId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  type: z.enum(['VIDEO', 'TEXT', 'QUIZ', 'ASSIGNMENT']),
  attachments: z.array(attachmentSchema),
  position: z.number().int(),
  isPublished: z.boolean(),
  isFree: z.boolean(),
  video: z
    .object({
      duration: z.number().nullable(),
      bunnyVideoId: z.string(),
      thumbnailUrl: z.string().nullable().optional(),
      hlsUrl: z.string().nullable().optional(),
    })
    .nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const sectionSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  position: z.number().int(),
  isPublished: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lectures: z.array(lectureSchema),
});

const prerequisiteSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  thumbnailUrl: z.string(),
  price: z.number(),
  currency: z.literal('USD'),
  rating: z.number(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS']),
  duration: z.number(),
  studentCount: z.number().int(),
});

export const enrollmentCourseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  shortDescription: z.string().nullable(),
  slug: z.string(),
  thumbnailUrl: z.string(),
  previewVideo: z.string().nullable(),
  instructorId: z.string(),
  price: z.number(),
  compareAtPrice: z.number().nullable(),
  currency: z.literal('USD'),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS']),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED', 'UNDER_REVIEW']),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'UNLISTED']),
  isFeatured: z.boolean(),
  hours: z.number().nullable(),
  requirements: z.array(z.string()),
  objectives: z.array(z.string()),
  targetAudience: z.array(z.string()),
  tags: z.array(z.string()),
  prerequisiteIds: z.array(z.string()),
  prerequisites: z.array(prerequisiteSchema),
  firstLectureId: z.string().optional(),
  lecturesCount: z.number().int(),
  sections: z.array(sectionSchema),
  metaTitle: z.string().nullable(),
  metaDescription: z.string().nullable(),
  certificateEnabled: z.boolean(),
  maxStudents: z.number().int().nullable(),
  pathId: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  publishedAt: z.string().datetime().nullable(),
});

export const enrollmentReviewSchema = z
  .object({
    id: z.string(),
    courseId: z.string(),
    userId: z.string(),
    rating: z.number().int(),
    comment: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .nullable();

export const enrollmentProgressSchema = z.object({
  totalLectures: z.number().int(),
  completedLectures: z.number().int(),
  totalTimeSpent: z.number().int(),
  completionPercentage: z.number(),
  lastAccessedAt: z.string().datetime().nullable(),
});

export const enrollmentPurchaseSchema = z
  .object({
    orderItemId: z.string().nullable(),
    status: z
      .enum(['ACTIVE', 'REFUND_PENDING', 'REFUNDED', 'FINALIZED'])
      .nullable(),
    refundStatus: z.string().nullable(),
    refundedAt: z.string().datetime().nullable(),
  })
  .nullable();

export const enrollmentListItemSchema = z.object({
  enrollment: enrollmentObjectSchema,
  course: enrollmentCourseSchema,
  review: enrollmentReviewSchema,
  progress: enrollmentProgressSchema,
  purchase: enrollmentPurchaseSchema,
});

export const enrollmentListPaginationSchema = z.object({
  currentPage: z.number().int(),
  totalPages: z.number().int(),
  totalItems: z.number().int(),
  itemsPerPage: z.number().int(),
});

export const enrollmentListDataSchema = z.object({
  courses: z.array(enrollmentListItemSchema),
  pagination: enrollmentListPaginationSchema,
});
