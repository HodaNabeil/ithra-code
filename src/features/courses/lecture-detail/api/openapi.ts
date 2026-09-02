import { z } from '@/lib/zod-openapi';

const lectureTypeSchema = z.enum([
  'VIDEO',
  'TEXT',
  'AUDIO',
  'QUIZ',
  'ASSIGNMENT',
  'LIVE_SESSION',
  'ATTACHMENT',
]);

export const lectureDetailDtoSchema = z.object({
  id: z.string(),
  sectionId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  type: lectureTypeSchema,
  content: z.string().nullable(),
  videoId: z.string().nullable(),
  videoHlsUrl: z
    .string()
    .nullable()
    .describe(
      'Signed Bunny Stream HLS URL when the video is ready; null while processing or when signing is unavailable',
    ),
  position: z.number().int(),
  isPublished: z.boolean(),
  isFree: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const lectureDetailCourseApiSchema = z.object({
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
  prerequisites: z.array(z.unknown()),
  firstLectureId: z.string().optional(),
  lecturesCount: z.number().int(),
  sections: z.array(z.unknown()),
  rating: z.number(),
  ratingCount: z.number().int(),
  metaTitle: z.string().nullable(),
  metaDescription: z.string().nullable(),
  certificateEnabled: z.boolean(),
  maxStudents: z.number().int().nullable(),
  pathId: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  publishedAt: z.string().datetime().nullable(),
  isPurchased: z.boolean(),
  isInCart: z.boolean(),
});

export const getLectureResponseSchema = z.object({
  lecture: lectureDetailDtoSchema,
  course: lectureDetailCourseApiSchema,
  hasPurchased: z
    .boolean()
    .describe(
      'True when the viewer is admin, course instructor, or has ACTIVE/COMPLETED enrollment',
    ),
  hasRated: z
    .boolean()
    .describe('True when the authenticated user has submitted a course review'),
});
