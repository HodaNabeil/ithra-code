import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from '@asteasolutions/zod-to-openapi';
import { z } from '@/lib/zod-openapi';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '@/validation/auth';
import { courseIdSchema } from '@/validation/cart';
import { cartApiResponseSchema } from '@/features/cart/dto/cart.dto';
import { addCartItemBodySchema } from '@/features/cart/presentation/validators/add-cart-item.validator';
import { createCourseSchema } from '@/features/courses/course-creation/dto/create-course.dto';
import { registerEnrollmentsOpenApi } from '@/features/enrollments/api/register-enrollments-openapi';
import { registerLectureDetailOpenApi } from '@/features/courses/lecture-detail/api/register-lecture-detail-openapi';
import { registerLectureProgressOpenApi } from '@/features/courses/lecture-progress/api/register-lecture-progress-openapi';

const registry = new OpenAPIRegistry();

// ─── Swagger examples (match seeded data) ─────────────────────────────────────

const EX = {
  courseSlug: 'nodejs-complete-guide',
  courseId: 'clg2v3z5f000008l5d6e3k1n',
  pathSlug: 'full-stack-web-development',
  pathId: 'clpath2k4m000008l5d6e3k1n',
  trackId: 'cltrack2k4m00008l5d6e3k1n',
  orderId: 'clorder2k4m00008l5d6e3k1n',
  instructorId: 'clinstr2k4m00008l5d6e3k1n',
  email: 'student@example.com',
  password: 'SecurePass1!',
} as const;

const idOrSlugParams = z.object({
  idOrSlug: z.string().openapi({
    example: EX.courseSlug,
    description: 'Course UUID or URL slug',
  }),
});

const pathSlugParams = z.object({
  slug: z.string().openapi({
    example: EX.pathSlug,
    description: 'Learning path URL slug',
  }),
});

const orderIdParams = z.object({
  id: z.string().openapi({
    example: EX.orderId,
    description: 'Order UUID',
  }),
});

const courseIdParams = z.object({
  courseId: courseIdSchema,
});

const lectureIdParams = z.object({
  lectureId: z.string().cuid().openapi({
    example: 'cllecture2k4m00008l5d6e3k1n',
    description: 'Lecture UUID (CUID)',
  }),
});

const sectionIdParams = z.object({
  sectionId: z.string().cuid().openapi({
    example: 'clsection2k4m00008l5d6e3k1n',
    description: 'Section UUID (CUID)',
  }),
});

const courseExample = {
  id: EX.courseId,
  instructorId: EX.instructorId,
  title: 'Node.js - دورة شاملة لتعلم تطوير الخلفية',
  description: 'دورة شاملة لتعلم Node.js من البداية حتى الاحتراف.',
  shortDescription: 'تعلم Node.js من الصفر وابن تطبيقات خلفية احترافية',
  slug: EX.courseSlug,
  thumbnailUrl:
    'https://images.unsplash.com/photo-1619410283995-43d9134e7656?w=800',
  previewVideo: 'https://example.com/videos/nodejs-preview.mp4',
  price: 499,
  compareAtPrice: 799,
  currency: 'USD' as const,
  level: 'BEGINNER' as const,
  status: 'PUBLISHED' as const,
  visibility: 'PUBLIC' as const,
  isFeatured: true,
  duration: 1800,
  requirements: ['معرفة أساسية بـ JavaScript'],
  objectives: ['إتقان أساسيات Node.js و npm'],
  targetAudience: ['مطورو الويب المبتدئين'],
  tags: ['nodejs', 'javascript', 'backend'],
  pathId: EX.pathId,
  trackId: null,
  publishedAt: '2026-01-15T10:00:00.000Z',
  createdAt: '2026-01-01T10:00:00.000Z',
  updatedAt: '2026-01-15T10:00:00.000Z',
};

const pathExample = {
  id: EX.pathId,
  title: 'تطوير الويب الشامل',
  slug: EX.pathSlug,
  tagline: 'من الصفر إلى الاحتراف',
  shortDescription: 'مسار شامل لتعلم تطوير الويب',
  description: 'تعلم HTML و CSS و JavaScript و React و Node.js',
  thumbnailUrl:
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
  category: 'WEB' as const,
  icon: 'code',
  isPublished: true,
  sortOrder: 1,
  createdAt: '2026-01-01T10:00:00.000Z',
  updatedAt: '2026-01-15T10:00:00.000Z',
};

const paginationExample = {
  page: 1,
  limit: 12,
  total: 24,
  totalPages: 2,
};

const apiSuccessExample = <T>(message: string, data: T) => ({
  success: true as const,
  message,
  data,
});

const apiErrorExample = {
  success: false as const,
  message: 'المورد غير موجود',
};

const alreadyInCartErrorExample = {
  success: false as const,
  message: 'هذه الدورة موجودة بالفعل في سلتك',
};

const cartErrorExample = {
  error: 'غير مصرح',
};

const currencySchema = z.enum(['USD']);
const courseLevelSchema = z.enum([
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED',
  'ALL_LEVELS',
]);
const courseStatusSchema = z.enum([
  'DRAFT',
  'PUBLISHED',
  'ARCHIVED',
  'UNDER_REVIEW',
]);
const courseVisibilitySchema = z.enum(['PUBLIC', 'PRIVATE', 'UNLISTED']);
const roleSchema = z.enum(['STUDENT', 'INSTRUCTOR', 'ADMIN']);
const pathCategorySchema = z.enum(['WEB', 'MOBILE', 'OTHER']);
const lectureTypeSchema = z.enum([
  'VIDEO',
  'TEXT',
  'AUDIO',
  'QUIZ',
  'ASSIGNMENT',
  'LIVE_SESSION',
  'ATTACHMENT',
]);

// ─── Response wrappers ────────────────────────────────────────────────────────

const ApiErrorSchema = registry.register(
  'ApiError',
  z.object({
    success: z.literal(false),
    message: z.string(),
  }),
);

const CartErrorSchema = registry.register(
  'CartError',
  z.object({
    error: z.string(),
  }),
);

function registerApiSuccess<T extends z.ZodType>(name: string, dataSchema: T) {
  return registry.register(
    name,
    z.object({
      success: z.literal(true),
      message: z.string(),
      data: dataSchema,
    }),
  );
}

// ─── Request schemas (from validation / DTOs) ─────────────────────────────────

registry.register('LoginRequest', loginSchema);
registry.register('RegisterRequest', registerSchema);
registry.register('ForgotPasswordRequest', forgotPasswordSchema);
registry.register('ResetPasswordRequest', resetPasswordSchema);
registry.register('VerifyEmailRequest', verifyEmailSchema);
registry.register('AddToCartRequest', z.object({ courseId: courseIdSchema }));
registry.register('CreateCourseRequest', createCourseSchema);

// Lecture request schemas
const createLectureSchema = z.object({
  title: z.string().min(1).openapi({
    example: 'مقدمة إلى Node.js',
    description: 'Lecture title',
  }),
  description: z.string().nullable().optional().openapi({
    example: 'في هذه المحاضرة سنتعرف على Node.js وكيفية استخدامه',
    description: 'Lecture description (optional, defaults to null)',
  }),
  type: lectureTypeSchema.openapi({
    example: 'VIDEO',
    description: 'Lecture type',
  }),
});

const updateLectureSchema = z.object({
  title: z.string().min(1).optional().openapi({
    example: 'مقدمة إلى Node.js - محدثة',
    description: 'Lecture title',
  }),
  description: z.string().optional().openapi({
    example: 'وصف محدث للمحاضرة',
    description: 'Lecture description',
  }),
  type: z.enum(['VIDEO', 'TEXT', 'QUIZ', 'ASSIGNMENT']).optional().openapi({
    example: 'VIDEO',
    description: 'Lecture type',
  }),
  content: z.string().optional().openapi({
    example: 'محتوى محدث',
    description: 'Text content',
  }),
  position: z.number().int().optional().openapi({
    example: 2,
    description: 'Display position',
  }),
  isPublished: z.boolean().optional().openapi({
    example: true,
    description: 'Publication status',
  }),
  isFree: z.boolean().optional().openapi({
    example: false,
    description: 'Free preview status',
  }),
});

registry.register('CreateLectureRequest', createLectureSchema);
registry.register('UpdateLectureRequest', updateLectureSchema);

// ─── Domain schemas ───────────────────────────────────────────────────────────

registry.register(
  'User',
  z.object({
    id: z.string(),
    email: z.string().email(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    profilePicture: z.string().nullable(),
    bio: z.string().nullable(),
    role: roleSchema,
    isEmailVerified: z.boolean(),
    isActive: z.boolean(),
    timezone: z.string().nullable(),
    language: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
);

const CourseSchema = registry.register(
  'Course',
  z.object({
    id: z.string(),
    instructorId: z.string(),
    title: z.string(),
    description: z.string(),
    shortDescription: z.string().nullable(),
    slug: z.string(),
    thumbnailUrl: z.string(),
    previewVideo: z.string().nullable(),
    price: z.number(),
    compareAtPrice: z.number().nullable(),
    currency: currencySchema,
    level: courseLevelSchema,
    status: courseStatusSchema,
    visibility: courseVisibilitySchema,
    isFeatured: z.boolean(),
    duration: z.number().int().nullable(),
    requirements: z.array(z.string()),
    objectives: z.array(z.string()),
    targetAudience: z.array(z.string()),
    tags: z.array(z.string()),
    pathId: z.string(),
    trackId: z.string().nullable(),
    publishedAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
);

const CreateCourseResponseSchema = registry.register(
  'CreateCourseResponse',
  z.object({
    id: z.string(),
    slug: z.string(),
    status: courseStatusSchema,
    visibility: courseVisibilitySchema,
    title: z.string(),
    price: z.number(),
  }),
);

const PathSchema = registry.register(
  'Path',
  z.object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
    tagline: z.string().nullable(),
    shortDescription: z.string().nullable(),
    description: z.string(),
    thumbnailUrl: z.string(),
    category: pathCategorySchema,
    icon: z.string().nullable(),
    isPublished: z.boolean(),
    sortOrder: z.number().int(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
);

const OrderItemSchema = registry.register(
  'OrderItem',
  z.object({
    id: z.string(),
    orderId: z.string(),
    courseId: z.string(),
    priceCents: z.number().int(),
    currency: currencySchema,
    status: z.enum(['ACTIVE', 'REFUND_PENDING', 'REFUNDED', 'FINALIZED']),
    refundedAt: z.string().datetime().nullable(),
    course: CourseSchema.optional(),
  }),
);

const OrderSchema = registry.register(
  'Order',
  z.object({
    id: z.string(),
    orderNumber: z.string(),
    userId: z.string(),
    subtotalCents: z.number().int(),
    discountCents: z.number().int(),
    taxCents: z.number().int(),
    totalCents: z.number().int(),
    currency: currencySchema,
    status: z.enum([
      'PENDING',
      'PROCESSING',
      'COMPLETED',
      'CANCELLED',
      'REFUNDED',
      'PARTIALLY_REFUNDED',
      'VOIDED',
    ]),
    couponCode: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    completedAt: z.string().datetime().nullable(),
    items: z.array(OrderItemSchema).optional(),
  }),
);

const PaginationMetaSchema = registry.register(
  'PaginationMeta',
  z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
);

// ─── Query schemas ────────────────────────────────────────────────────────────

const courseListQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .openapi({ example: '1', description: 'Page number (1-based)' }),
  limit: z
    .string()
    .optional()
    .openapi({ example: '12', description: 'Items per page' }),
  search: z.string().optional().openapi({
    example: 'node',
    description: 'Search in title and description',
  }),
  sort: z
    .string()
    .optional()
    .openapi({ example: 'newest', description: 'Sort order' }),
  path: z
    .string()
    .optional()
    .openapi({ example: EX.pathSlug, description: 'Filter by path slug' }),
  category: z
    .string()
    .optional()
    .openapi({ example: 'WEB', description: 'Category filter' }),
  level: courseLevelSchema
    .optional()
    .openapi({ example: 'BEGINNER', description: 'Course level' }),
  featured: z
    .string()
    .optional()
    .openapi({ example: 'true', description: 'Featured courses only' }),
});

const pathListQuerySchema = z.object({
  page: z.string().optional().openapi({ example: '1' }),
  limit: z.string().optional().openapi({ example: '12' }),
  search: z.string().optional().openapi({ example: 'web' }),
  sort: z
    .enum(['newest', 'oldest', 'title'])
    .optional()
    .openapi({ example: 'newest' }),
  category: pathCategorySchema.optional().openapi({ example: 'WEB' }),
});

// ─── Security ─────────────────────────────────────────────────────────────────

registry.registerComponent('securitySchemes', 'sessionAuth', {
  type: 'apiKey',
  in: 'cookie',
  name: 'authjs.session-token',
  description: 'NextAuth session cookie (set after OAuth or credentials login)',
});

const authenticated = [{ sessionAuth: [] }];

// ─── API paths ────────────────────────────────────────────────────────────────

registry.registerPath({
  method: 'get',
  path: '/courses',
  tags: ['Courses'],
  summary: 'List published courses',
  request: { query: courseListQuerySchema },
  responses: {
    200: {
      description: 'Course list',
      content: {
        'application/json': {
          schema: registerApiSuccess(
            'CourseListResponse',
            z.object({
              items: z.array(CourseSchema),
              meta: PaginationMetaSchema,
            }),
          ),
          example: apiSuccessExample('تم جلب الدورات بنجاح', {
            items: [courseExample],
            meta: paginationExample,
          }),
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ApiErrorSchema,
          example: apiErrorExample,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/courses',
  tags: ['Courses'],
  summary: 'Create a course draft',
  security: authenticated,
  request: {
    body: {
      content: {
        'application/json': {
          schema: createCourseSchema,
          example: {
            slug: 'my-new-course',
            pathId: EX.pathId,
            trackId: EX.trackId,
          },
        },
      },
      required: true,
    },
  },
  responses: {
    201: {
      description: 'Course created',
      content: {
        'application/json': {
          schema: registerApiSuccess(
            'CreateCourseSuccess',
            z.object({ course: CreateCourseResponseSchema }),
          ),
          example: apiSuccessExample('تم إنشاء الدورة بنجاح', {
            course: {
              id: EX.courseId,
              slug: 'my-new-course',
              status: 'DRAFT',
              visibility: 'PRIVATE',
              title: 'دورة جديدة',
              price: 0,
            },
          }),
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ApiErrorSchema,
          example: apiErrorExample,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ApiErrorSchema,
          example: apiErrorExample,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/courses/{idOrSlug}',
  tags: ['Courses'],
  summary: 'Get course details',
  request: {
    params: idOrSlugParams,
  },
  responses: {
    200: {
      description: 'Course detail',
      content: {
        'application/json': {
          schema: registerApiSuccess(
            'CourseDetailResponse',
            z.object({ course: z.record(z.string(), z.unknown()) }),
          ),
          example: apiSuccessExample('تم جلب تفاصيل الدورة بنجاح', {
            course: courseExample,
          }),
        },
      },
    },
    404: {
      description: 'Course not found',
      content: {
        'application/json': {
          schema: ApiErrorSchema,
          example: apiErrorExample,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ApiErrorSchema,
          example: apiErrorExample,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'put',
  path: '/courses/{idOrSlug}',
  tags: ['Courses'],
  summary: 'Update a course',
  request: {
    params: idOrSlugParams,
    body: {
      content: {
        'application/json': {
          schema: z.record(z.string(), z.unknown()),
          example: {
            title: 'Node.js - دورة محدّثة',
            price: 549,
            shortDescription: 'وصف مختصر محدّث للدورة',
          },
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Updated course',
      content: {
        'application/json': {
          schema: CourseSchema,
          example: {
            ...courseExample,
            title: 'Node.js - دورة محدّثة',
            price: 549,
          },
        },
      },
    },
    500: { description: 'Update failed or course not found' },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/courses/{idOrSlug}',
  tags: ['Courses'],
  summary: 'Archive a course',
  security: authenticated,
  request: {
    params: idOrSlugParams,
  },
  responses: {
    200: {
      description: 'Course archived',
      content: {
        'application/json': {
          schema: registerApiSuccess(
            'ArchiveCourseResponse',
            z.object({
              id: z.string(),
              slug: z.string(),
              status: courseStatusSchema,
            }),
          ),
          example: apiSuccessExample('تم أرشفة الدورة بنجاح', {
            id: EX.courseId,
            slug: EX.courseSlug,
            status: 'ARCHIVED',
          }),
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ApiErrorSchema,
          example: apiErrorExample,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ApiErrorSchema,
          example: apiErrorExample,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/courses/{idOrSlug}/access',
  tags: ['Courses'],
  summary: 'Check enrollment access for a course',
  security: authenticated,
  request: {
    params: idOrSlugParams,
  },
  responses: {
    200: {
      description: 'Access status',
      content: {
        'application/json': {
          schema: registerApiSuccess(
            'CourseAccessResponse',
            z.object({ isEnrolled: z.boolean() }),
          ),
          example: apiSuccessExample('تم التحقق من الوصول بنجاح', {
            isEnrolled: true,
          }),
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ApiErrorSchema,
          example: apiErrorExample,
        },
      },
    },
    404: {
      description: 'Course not found',
      content: {
        'application/json': {
          schema: ApiErrorSchema,
          example: apiErrorExample,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ApiErrorSchema,
          example: apiErrorExample,
        },
      },
    },
  },
});

const courseOverviewExample = {
  totalHours: 0,
  totalStudents: 1,
  rating: 0,
  ratingsCount: 0,
  lastUpdated: 'June 2026',
  lecturesCount: 6,
  skillLevel: 'Beginner',
  description:
    'دورة شاملة لتعلم Node.js من البداية حتى الاحتراف. ستتعلم كيفية بناء تطبيقات خلفية قوية وآمنة باستخدام Node.js و Express و NestJS.\n\n## ما ستتعلمه في هذه الدورة:\n- أساسيات Node.js و JavaScript الحديث\n- بناء واجهات برمجة تطبيقات RESTful APIs\n- العمل مع قواعد البيانات (MongoDB, PostgreSQL)\n- المصادقة والتفويض (JWT, OAuth)\n- رفع الملفات ومعالجة الصور\n- WebSockets والتواصل الفوري\n- نشر التطبيقات على السحابة\n\n## المتطلبات:\n- معرفة أساسية بـ JavaScript\n- فهم مبادئ البرمجة الأساسية',
};

const CourseOverviewSchema = registry.register(
  'CourseOverview',
  z.object({
    totalHours: z
      .number()
      .openapi({ example: courseOverviewExample.totalHours }),
    totalStudents: z
      .number()
      .int()
      .openapi({ example: courseOverviewExample.totalStudents }),
    rating: z.number().openapi({ example: courseOverviewExample.rating }),
    ratingsCount: z
      .number()
      .int()
      .openapi({ example: courseOverviewExample.ratingsCount }),
    lastUpdated: z
      .string()
      .openapi({ example: courseOverviewExample.lastUpdated }),
    lecturesCount: z
      .number()
      .int()
      .openapi({ example: courseOverviewExample.lecturesCount }),
    skillLevel: z
      .string()
      .openapi({ example: courseOverviewExample.skillLevel }),
    description: z
      .string()
      .openapi({ example: courseOverviewExample.description }),
  }),
);

const courseOverviewSuccessExample = {
  success: true,
  message: 'تم جلب نظرة عامة على الدورة بنجاح',
  data: {
    overview: courseOverviewExample,
  },
};

registry.registerPath({
  method: 'get',
  path: '/courses/{idOrSlug}/overview',
  tags: ['Courses'],
  summary: 'Get course overview stats and description',
  description:
    'Returns aggregated course stats (duration, students, rating, lectures) and the full course description. Works with a course ID or slug — e.g. `GET /api/courses/nodejs-complete-guide/overview`.',
  request: {
    params: idOrSlugParams,
  },
  responses: {
    200: {
      description: 'Course overview',
      content: {
        'application/json': {
          schema: registerApiSuccess(
            'CourseOverviewResponse',
            z.object({ overview: CourseOverviewSchema }),
          ),
          example: courseOverviewSuccessExample,
        },
      },
    },
    404: {
      description: 'Course not found',
      content: {
        'application/json': {
          schema: ApiErrorSchema,
          example: apiErrorExample,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ApiErrorSchema,
          example: apiErrorExample,
        },
      },
    },
  },
});

const lectureProgressExample = {
  isCompleted: true,
  timeSpent: 120,
  lastAccessedAt: '2026-06-01T10:00:00.000Z',
  completedAt: '2026-06-01T10:30:00.000Z',
};

const LectureProgressSchema = registry.register(
  'LectureProgress',
  z.object({
    isCompleted: z
      .boolean()
      .openapi({ example: lectureProgressExample.isCompleted }),
    timeSpent: z
      .number()
      .int()
      .openapi({ example: lectureProgressExample.timeSpent }),
    lastAccessedAt: z
      .string()
      .nullable()
      .openapi({ example: lectureProgressExample.lastAccessedAt }),
    completedAt: z
      .string()
      .nullable()
      .openapi({ example: lectureProgressExample.completedAt }),
  }),
);

const videoExample = {
  id: 'clvideo2k4m00008l5d6e3k1n',
  bunnyVideoId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  libraryId: '12345',
  status: 'ready',
  duration: 600,
  thumbnailUrl: 'https://example.com/thumb.jpg',
  hlsUrl:
    'https://vz-xxxxx.b-cdn.net/a1b2c3d4-e5f6-7890-abcd-ef1234567890/playlist.m3u8?token=abc&expires=1234567890',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const VideoSchema = registry.register(
  'CourseSectionVideo',
  z.object({
    id: z.string().openapi({ example: videoExample.id }),
    bunnyVideoId: z.string().openapi({ example: videoExample.bunnyVideoId }),
    libraryId: z.string().openapi({ example: videoExample.libraryId }),
    status: z.string().openapi({ example: videoExample.status }),
    duration: z.number().nullable().openapi({ example: videoExample.duration }),
    thumbnailUrl: z
      .string()
      .nullable()
      .openapi({ example: videoExample.thumbnailUrl }),
    hlsUrl: z.string().optional().openapi({ example: videoExample.hlsUrl }),
    createdAt: z.string().openapi({ example: videoExample.createdAt }),
    updatedAt: z.string().openapi({ example: videoExample.updatedAt }),
  }),
);

const attachmentExample = {
  id: 'clattach2k4m00008l5d6e3k1n',
  name: 'slides.pdf',
  type: 'PDF',
  url: 'https://example.com/slides.pdf',
  isDownloadable: true,
  position: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const AttachmentSchema = registry.register(
  'CourseSectionAttachment',
  z.object({
    id: z.string().openapi({ example: attachmentExample.id }),
    name: z.string().openapi({ example: attachmentExample.name }),
    type: z.string().openapi({ example: attachmentExample.type }),
    url: z.string().openapi({ example: attachmentExample.url }),
    isDownloadable: z
      .boolean()
      .openapi({ example: attachmentExample.isDownloadable }),
    position: z.number().int().openapi({ example: attachmentExample.position }),
    createdAt: z.string().openapi({ example: attachmentExample.createdAt }),
    updatedAt: z.string().openapi({ example: attachmentExample.updatedAt }),
  }),
);

const lectureExample = {
  id: 'cllecture2k4m00008l5d6e3k1n',
  title: 'Introduction to Node.js',
  description: 'Overview of Node.js runtime',
  type: 'VIDEO',
  videoDuration: 600,
  position: 1,
  isPublished: true,
  isFree: true,
  video: videoExample,
  attachments: [attachmentExample],
  progress: lectureProgressExample,
};

const LectureSchema = registry.register(
  'CourseSectionLecture',
  z.object({
    id: z.string().openapi({ example: lectureExample.id }),
    title: z.string().openapi({ example: lectureExample.title }),
    description: z
      .string()
      .nullable()
      .openapi({ example: lectureExample.description }),
    type: z.string().openapi({ example: lectureExample.type }),
    videoDuration: z
      .number()
      .nullable()
      .openapi({ example: lectureExample.videoDuration }),
    position: z.number().int().openapi({ example: lectureExample.position }),
    isPublished: z.boolean().openapi({ example: lectureExample.isPublished }),
    isFree: z.boolean().openapi({ example: lectureExample.isFree }),
    video: VideoSchema.optional().openapi({ example: lectureExample.video }),
    attachments: z
      .array(AttachmentSchema)
      .openapi({ example: lectureExample.attachments }),
    progress: LectureProgressSchema.nullable()
      .optional()
      .openapi({ example: lectureExample.progress }),
  }),
);

// ─── Lecture Detail Schemas ───────────────────────────────────────────────────

const lectureDetailExample = {
  id: 'cllecture2k4m00008l5d6e3k1n',
  sectionId: 'clsection2k4m00008l5d6e3k1n',
  title: 'مقدمة إلى Node.js',
  description:
    'في هذه المحاضرة سنتعرف على Node.js وكيفية استخدامه في بناء التطبيقات',
  type: 'VIDEO',
  content: null,
  videoId: 'clvideo2k4m00008l5d6e3k1n',
  videoHlsUrl:
    'https://vz-xxxxx.b-cdn.net/a1b2c3d4-e5f6-7890-abcd-ef1234567890/playlist.m3u8?token=abc&expires=1234567890',
  position: 1,
  isPublished: true,
  isFree: false,
  createdAt: '2026-01-01T10:00:00.000Z',
  updatedAt: '2026-01-01T10:00:00.000Z',
};

const LectureDetailSchema = registry.register(
  'LectureDetail',
  z.object({
    id: z.string().openapi({ example: lectureDetailExample.id }),
    sectionId: z.string().openapi({ example: lectureDetailExample.sectionId }),
    title: z.string().openapi({ example: lectureDetailExample.title }),
    description: z
      .string()
      .nullable()
      .openapi({ example: lectureDetailExample.description }),
    type: lectureTypeSchema.openapi({ example: lectureDetailExample.type }),
    content: z
      .string()
      .nullable()
      .openapi({ example: lectureDetailExample.content }),
    videoId: z
      .string()
      .nullable()
      .openapi({ example: lectureDetailExample.videoId }),
    videoHlsUrl: z
      .string()
      .nullable()
      .openapi({ example: lectureDetailExample.videoHlsUrl }),
    position: z
      .number()
      .int()
      .openapi({ example: lectureDetailExample.position }),
    isPublished: z
      .boolean()
      .openapi({ example: lectureDetailExample.isPublished }),
    isFree: z.boolean().openapi({ example: lectureDetailExample.isFree }),
    createdAt: z.string().openapi({ example: lectureDetailExample.createdAt }),
    updatedAt: z.string().openapi({ example: lectureDetailExample.updatedAt }),
  }),
);

const createLectureItemExample = {
  id: 'cllecture2k4m00008l5d6e3k1n',
  sectionId: 'clsection2k4m00008l5d6e3k1n',
  title: 'مقدمة إلى Node.js',
  description: null,
  type: 'VIDEO',
  content: null,
  videoId: null,
  position: 0,
  isPublished: false,
  isFree: false,
};

const CreateLectureItemSchema = registry.register(
  'CreateLectureItem',
  z.object({
    id: z.string().openapi({ example: createLectureItemExample.id }),
    sectionId: z
      .string()
      .openapi({ example: createLectureItemExample.sectionId }),
    title: z.string().openapi({ example: createLectureItemExample.title }),
    description: z
      .string()
      .nullable()
      .openapi({ example: createLectureItemExample.description }),
    type: lectureTypeSchema.openapi({
      example: createLectureItemExample.type,
    }),
    content: z
      .string()
      .nullable()
      .openapi({ example: createLectureItemExample.content }),
    videoId: z
      .string()
      .nullable()
      .openapi({ example: createLectureItemExample.videoId }),
    position: z
      .number()
      .int()
      .openapi({ example: createLectureItemExample.position }),
    isPublished: z
      .boolean()
      .openapi({ example: createLectureItemExample.isPublished }),
    isFree: z.boolean().openapi({ example: createLectureItemExample.isFree }),
  }),
);

const createLectureResponseExample = {
  lecture: createLectureItemExample,
};

const CreateLectureResponseSchema = registry.register(
  'CreateLectureResponse',
  z.object({
    lecture: CreateLectureItemSchema,
  }),
);

const sectionStatisticsExample = {
  totalLectures: 3,
  totalDuration: 1800,
  completedLectures: 1,
};

const SectionStatisticsSchema = registry.register(
  'SectionStatistics',
  z.object({
    totalLectures: z
      .number()
      .int()
      .openapi({ example: sectionStatisticsExample.totalLectures }),
    totalDuration: z
      .number()
      .int()
      .openapi({ example: sectionStatisticsExample.totalDuration }),
    completedLectures: z
      .number()
      .int()
      .openapi({ example: sectionStatisticsExample.completedLectures }),
  }),
);

const sectionExample = {
  id: 'clsection2k4m00008l5d6e3k1n',
  courseId: EX.courseId,
  title: 'Getting Started',
  description: 'Introduction section',
  position: 1,
  isPublished: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  lectures: [lectureExample],
  statistics: sectionStatisticsExample,
};

const SectionWithStatsSchema = registry.register(
  'SectionWithStats',
  z.object({
    id: z.string().openapi({ example: sectionExample.id }),
    courseId: z.string().openapi({ example: sectionExample.courseId }),
    title: z.string().openapi({ example: sectionExample.title }),
    description: z
      .string()
      .nullable()
      .openapi({ example: sectionExample.description }),
    position: z.number().int().openapi({ example: sectionExample.position }),
    isPublished: z.boolean().openapi({ example: sectionExample.isPublished }),
    createdAt: z.string().openapi({ example: sectionExample.createdAt }),
    updatedAt: z.string().openapi({ example: sectionExample.updatedAt }),
    lectures: z
      .array(LectureSchema)
      .openapi({ example: sectionExample.lectures }),
    statistics: SectionStatisticsSchema.openapi({
      example: sectionExample.statistics,
    }),
  }),
);

const courseSectionsSuccessExample = {
  success: true,
  message: 'تم جلب الأقسام بنجاح',
  data: {
    sections: [sectionExample],
    total: 1,
  },
};

const courseIdOrSlugParams = registry.register(
  'CourseIdOrSlugParam',
  z.object({
    courseIdOrSlug: z
      .string()
      .openapi({
        param: { name: 'courseIdOrSlug', in: 'path' },
        example: 'nodejs-complete-guide',
        description: 'Course CUID or slug',
      }),
  }),
);

registry.registerPath({
  method: 'get',
  path: '/v1/courses/{courseIdOrSlug}/sections',
  tags: ['Courses'],
  summary: 'Get course sections with lectures and progress',
  description:
    'Returns ordered course sections with nested lectures, attachments, video metadata, and optional progress for enrolled users. Works with a course ID or slug — e.g. `GET /api/v1/courses/nodejs-complete-guide/sections`. Authentication is optional.',
  request: {
    params: courseIdOrSlugParams,
  },
  responses: {
    200: {
      description: 'Course sections',
      content: {
        'application/json': {
          schema: registerApiSuccess(
            'CourseSectionsResponse',
            z.object({
              sections: z.array(SectionWithStatsSchema),
              total: z.number().int(),
            }),
          ),
          example: courseSectionsSuccessExample,
        },
      },
    },
    404: {
      description: 'Course not found',
      content: {
        'application/json': {
          schema: ApiErrorSchema,
          example: apiErrorExample,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ApiErrorSchema,
          example: apiErrorExample,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/paths',
  tags: ['Paths'],
  summary: 'List learning paths',
  request: { query: pathListQuerySchema },
  responses: {
    200: {
      description: 'Path list',
      content: {
        'application/json': {
          schema: registerApiSuccess(
            'PathListResponse',
            z.object({
              items: z.array(PathSchema),
              meta: PaginationMetaSchema,
            }),
          ),
          example: apiSuccessExample('تم جلب المسارات بنجاح', {
            items: [pathExample],
            meta: paginationExample,
          }),
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ApiErrorSchema,
          example: apiErrorExample,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/paths/{slug}',
  tags: ['Paths'],
  summary: 'Get learning path details',
  request: {
    params: pathSlugParams,
  },
  responses: {
    200: {
      description: 'Path detail',
      content: {
        'application/json': {
          schema: registerApiSuccess(
            'PathDetailResponse',
            z.record(z.string(), z.unknown()),
          ),
          example: apiSuccessExample('تم جلب تفاصيل المسار بنجاح', pathExample),
        },
      },
    },
    404: {
      description: 'Path not found',
      content: {
        'application/json': {
          schema: ApiErrorSchema,
          example: apiErrorExample,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ApiErrorSchema,
          example: apiErrorExample,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/cart',
  tags: ['Cart'],
  summary: 'Get current user cart',
  security: authenticated,
  responses: {
    200: {
      description: 'Cart retrieved (may be empty)',
      content: {
        'application/json': {
          schema: cartApiResponseSchema,
          example: {
            data: {
              id: null,
              userId: EX.instructorId,
              subtotal: 0,
              discount: 0,
              total: 0,
              currency: 'USD',
              items: [],
              coupon: null,
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          },
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: CartErrorSchema,
          example: cartErrorExample,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: CartErrorSchema,
          example: cartErrorExample,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/cart',
  tags: ['Cart'],
  summary: 'Clear the cart',
  description:
    'Removes all items from the current user cart, clears any applied coupon, and resets totals to 0. Idempotent: returns the empty cart even if the cart is already empty or does not exist.',
  security: authenticated,
  responses: {
    200: {
      description: 'Cart cleared (empty cart returned)',
      content: {
        'application/json': {
          schema: cartApiResponseSchema,
          example: {
            data: {
              id: null,
              userId: EX.instructorId,
              subtotal: 0,
              discount: 0,
              total: 0,
              currency: 'USD',
              items: [],
              coupon: null,
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          },
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: CartErrorSchema,
          example: cartErrorExample,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: CartErrorSchema,
          example: cartErrorExample,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/cart/items',
  tags: ['Cart'],
  summary: 'Add a course to the cart',
  security: authenticated,
  request: {
    body: {
      content: {
        'application/json': {
          schema: addCartItemBodySchema,
          example: { courseId: EX.courseId },
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Cart updated',
      content: {
        'application/json': {
          schema: cartApiResponseSchema,
        },
      },
    },
    400: {
      description:
        'Validation error, course not published, free course, already enrolled, already in cart, or currency mismatch',
      content: {
        'application/json': {
          schema: ApiErrorSchema,
          examples: {
            alreadyInCart: {
              summary: 'Already in cart',
              value: alreadyInCartErrorExample,
            },
            validationError: {
              summary: 'Validation error',
              value: {
                success: false,
                message: 'معرف الدورة غير صالح (تنسيق CUID مطلوب)',
              },
            },
          },
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ApiErrorSchema,
          example: apiErrorExample,
        },
      },
    },
    404: {
      description: 'Course not found',
      content: {
        'application/json': {
          schema: ApiErrorSchema,
          example: apiErrorExample,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ApiErrorSchema,
          example: apiErrorExample,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/cart/items/{courseId}',
  tags: ['Cart'],
  summary: 'Remove a course from the cart',
  security: authenticated,
  request: {
    params: courseIdParams,
  },
  responses: {
    200: {
      description: 'Item removed',
      content: {
        'application/json': {
          schema: z.object({ data: z.record(z.string(), z.unknown()) }),
          example: { data: { items: [], itemCount: 0 } },
        },
      },
    },
    400: {
      description: 'Invalid courseId',
      content: {
        'application/json': {
          schema: CartErrorSchema,
          example: cartErrorExample,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: CartErrorSchema,
          example: cartErrorExample,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: CartErrorSchema,
          example: cartErrorExample,
        },
      },
    },
  },
});

// ─── Lectures ─────────────────────────────────────────────────────────────────

registry.registerPath({
  method: 'post',
  path: '/sections/{sectionId}/lectures',
  tags: ['Lectures'],
  summary: 'Create a new lecture',
  description:
    'Creates a new lecture within an existing course section. Requires `lecture:create` permission (instructor or admin). Instructors may only create lectures in their own courses; admins may create in any course. Position, publication status, and content fields are set server-side.',
  security: authenticated,
  request: {
    params: sectionIdParams,
    body: {
      content: {
        'application/json': {
          schema: createLectureSchema,
          example: {
            title: 'مقدمة إلى Node.js',
            description: 'في هذه المحاضرة سنتعرف على Node.js',
            type: 'VIDEO',
          },
        },
      },
      required: true,
    },
  },
  responses: {
    201: {
      description: 'Lecture created successfully',
      content: {
        'application/json': {
          schema: registerApiSuccess(
            'CreateLectureSuccess',
            CreateLectureResponseSchema,
          ),
          example: apiSuccessExample(
            'Lecture created successfully',
            createLectureResponseExample,
          ),
        },
      },
    },
    400: {
      description: 'Validation error - invalid input data',
      content: {
        'application/json': {
          schema: ApiErrorSchema,
          example: {
            success: false,
            message: 'بيانات الإدخال غير صالحة',
          },
        },
      },
    },
    401: {
      description: 'Unauthorized - user not logged in',
      content: {
        'application/json': {
          schema: ApiErrorSchema,
          example: { success: false, message: 'Unauthorized' },
        },
      },
    },
    403: {
      description: 'Forbidden - insufficient permissions',
      content: {
        'application/json': {
          schema: ApiErrorSchema,
          example: { success: false, message: 'ليس لديك صلاحية' },
        },
      },
    },
    404: {
      description: 'Section or course not found',
      content: {
        'application/json': {
          schema: ApiErrorSchema,
          example: { success: false, message: 'Section not found' },
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ApiErrorSchema,
          example: apiErrorExample,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'put',
  path: '/lectures/{lectureId}',
  tags: ['Lectures'],
  summary: 'Update a lecture',
  description:
    'Updates an existing lecture. Requires instructor ownership or admin role. Only provided fields will be updated.',
  security: authenticated,
  request: {
    params: lectureIdParams,
    body: {
      content: {
        'application/json': {
          schema: updateLectureSchema,
          example: {
            title: 'مقدمة إلى Node.js - محدثة',
            description: 'وصف محدث للمحاضرة',
            isPublished: true,
          },
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Lecture updated successfully',
      content: {
        'application/json': {
          schema: registerApiSuccess(
            'UpdateLectureResponse',
            LectureDetailSchema,
          ),
          example: apiSuccessExample('تم تحديث المحاضرة بنجاح', {
            ...lectureDetailExample,
            title: 'مقدمة إلى Node.js - محدثة',
            description: 'وصف محدث للمحاضرة',
            isPublished: true,
          }),
        },
      },
    },
    400: {
      description: 'Validation error - invalid input data',
      content: {
        'application/json': {
          schema: ApiErrorSchema,
          example: {
            success: false,
            message: 'بيانات الإدخال غير صالحة',
          },
        },
      },
    },
    401: {
      description: 'Unauthorized - user not logged in',
      content: {
        'application/json': {
          schema: ApiErrorSchema,
          example: { success: false, message: 'Unauthorized' },
        },
      },
    },
    403: {
      description: 'Forbidden - insufficient permissions',
      content: {
        'application/json': {
          schema: ApiErrorSchema,
          example: { success: false, message: 'ليس لديك صلاحية' },
        },
      },
    },
    404: {
      description: 'Lecture not found',
      content: {
        'application/json': {
          schema: ApiErrorSchema,
          example: { success: false, message: 'المحاضرة غير موجودة' },
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ApiErrorSchema,
          example: apiErrorExample,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/lectures/{lectureId}',
  tags: ['Lectures'],
  summary: 'Delete a lecture',
  description:
    'Deletes a lecture from the course. Requires instructor ownership or admin role. This action is permanent and cannot be undone.',
  security: authenticated,
  request: {
    params: lectureIdParams,
  },
  responses: {
    200: {
      description: 'Lecture deleted successfully',
      content: {
        'application/json': {
          schema: registerApiSuccess(
            'DeleteLectureResponse',
            z.object({
              id: z.string(),
              title: z.string(),
            }),
          ),
          example: apiSuccessExample('تم حذف المحاضرة بنجاح', {
            id: 'cllecture2k4m00008l5d6e3k1n',
            title: 'مقدمة إلى Node.js',
          }),
        },
      },
    },
    401: {
      description: 'Unauthorized - user not logged in',
      content: {
        'application/json': {
          schema: ApiErrorSchema,
          example: { success: false, message: 'Unauthorized' },
        },
      },
    },
    403: {
      description: 'Forbidden - insufficient permissions',
      content: {
        'application/json': {
          schema: ApiErrorSchema,
          example: { success: false, message: 'ليس لديك صلاحية' },
        },
      },
    },
    404: {
      description: 'Lecture not found',
      content: {
        'application/json': {
          schema: ApiErrorSchema,
          example: { success: false, message: 'المحاضرة غير موجودة' },
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ApiErrorSchema,
          example: apiErrorExample,
        },
      },
    },
  },
});

// ─── Orders ───────────────────────────────────────────────────────────────────

const orderExample = {
  id: EX.orderId,
  orderNumber: 'ORD-2026-0001',
  userId: 'cluser2k4m000008l5d6e3k1n',
  subtotalCents: 49900,
  discountCents: 0,
  taxCents: 0,
  totalCents: 49900,
  currency: 'USD' as const,
  status: 'COMPLETED' as const,
  couponCode: null,
  createdAt: '2026-06-01T10:00:00.000Z',
  updatedAt: '2026-06-01T10:05:00.000Z',
  completedAt: '2026-06-01T10:05:00.000Z',
  items: [
    {
      id: 'clitem2k4m000008l5d6e3k1n',
      orderId: EX.orderId,
      courseId: EX.courseId,
      priceCents: 49900,
      currency: 'USD' as const,
      status: 'ACTIVE' as const,
      refundedAt: null,
      course: courseExample,
    },
  ],
};

registry.registerPath({
  method: 'get',
  path: '/orders/{id}',
  tags: ['Orders'],
  summary: 'Get order by ID',
  request: {
    params: orderIdParams,
  },
  responses: {
    200: {
      description: 'Order details',
      content: {
        'application/json': {
          schema: OrderSchema,
          example: orderExample,
        },
      },
    },
    404: { description: 'Order not found' },
  },
});

registerEnrollmentsOpenApi(registry, {
  registerApiSuccess,
  apiSuccessExample,
  ApiErrorSchema,
  apiErrorExample,
  authenticated,
  courseExample,
  courseId: EX.courseId,
});

registerLectureDetailOpenApi(registry, {
  registerApiSuccess,
  apiSuccessExample,
  ApiErrorSchema,
  apiErrorExample,
  authenticated,
  courseExample,
});

registerLectureProgressOpenApi(registry, {
  registerApiSuccess,
  apiSuccessExample,
  ApiErrorSchema,
  apiErrorExample,
  authenticated,
  courseSlug: EX.courseSlug,
  lectureId: 'cllecture2k4m00008l5d6e3k1n',
});

// ─── Document generator ─────────────────────────────────────────────────────────

export function getOpenApiDocument(): ReturnType<
  OpenApiGeneratorV3['generateDocument']
> {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Ithrcode API',
      version: '1.0',
      description: 'API Documentation',
    },
    servers: [{ url: '/api', description: 'API base path' }],
    tags: [
      { name: 'Courses', description: 'Course listing and management' },
      { name: 'Paths', description: 'Learning paths' },
      { name: 'Lectures', description: 'Course lecture management' },
      { name: 'Cart', description: 'Shopping cart' },
      { name: 'Orders', description: 'Order management' },
      { name: 'Enrollments', description: 'Student course enrollments' },
    ],
  });
}
