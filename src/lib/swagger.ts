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
import { createCourseSchema } from '@/features/courses/course-creation/dto/create-course.dto';

const registry = new OpenAPIRegistry();

// ─── Shared enums ─────────────────────────────────────────────────────────────

const currencySchema = z.enum(['USD', 'EGP']);
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

const courseCatalogQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  sort: z.string().optional(),
  path: z.string().optional(),
  category: z.string().optional(),
  level: courseLevelSchema.optional(),
  featured: z.string().optional(),
});

const pathCatalogQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['newest', 'oldest', 'title']).optional(),
  category: pathCategorySchema.optional(),
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
  request: { query: courseCatalogQuerySchema },
  responses: {
    200: {
      description: 'Course catalog',
      content: {
        'application/json': {
          schema: registerApiSuccess(
            'CourseCatalogResponse',
            z.object({
              items: z.array(CourseSchema),
              meta: PaginationMetaSchema,
            }),
          ),
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: { 'application/json': { schema: ApiErrorSchema } },
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
      content: { 'application/json': { schema: createCourseSchema } },
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
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
    500: {
      description: 'Internal server error',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/courses/{idOrSlug}',
  tags: ['Courses'],
  summary: 'Get course details',
  request: {
    params: z.object({ idOrSlug: z.string() }),
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
        },
      },
    },
    404: {
      description: 'Course not found',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
    500: {
      description: 'Internal server error',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'put',
  path: '/courses/{idOrSlug}',
  tags: ['Courses'],
  summary: 'Update a course',
  request: {
    params: z.object({ idOrSlug: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.record(z.string(), z.unknown()),
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Updated course',
      content: { 'application/json': { schema: CourseSchema } },
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
    params: z.object({ idOrSlug: z.string() }),
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
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
    500: {
      description: 'Internal server error',
      content: { 'application/json': { schema: ApiErrorSchema } },
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
    params: z.object({ idOrSlug: z.string() }),
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
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
    404: {
      description: 'Course not found',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
    500: {
      description: 'Internal server error',
      content: { 'application/json': { schema: ApiErrorSchema } },
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
    totalHours: z.number().openapi({ example: courseOverviewExample.totalHours }),
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
    skillLevel: z.string().openapi({ example: courseOverviewExample.skillLevel }),
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
    params: z.object({
      idOrSlug: z.string().openapi({
        example: 'nodejs-complete-guide',
        description: 'Course UUID or URL slug',
      }),
    }),
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
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
    500: {
      description: 'Internal server error',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/paths',
  tags: ['Paths'],
  summary: 'List learning paths',
  request: { query: pathCatalogQuerySchema },
  responses: {
    200: {
      description: 'Path catalog',
      content: {
        'application/json': {
          schema: registerApiSuccess(
            'PathCatalogResponse',
            z.object({
              items: z.array(PathSchema),
              meta: PaginationMetaSchema,
            }),
          ),
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/paths/{slug}',
  tags: ['Paths'],
  summary: 'Get learning path details',
  request: {
    params: z.object({ slug: z.string() }),
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
        },
      },
    },
    404: {
      description: 'Path not found',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
    500: {
      description: 'Internal server error',
      content: { 'application/json': { schema: ApiErrorSchema } },
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
          schema: z.object({ courseId: courseIdSchema }),
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
          schema: z.object({ data: z.record(z.string(), z.unknown()) }),
        },
      },
    },
    400: {
      description: 'Invalid courseId',
      content: { 'application/json': { schema: CartErrorSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: CartErrorSchema } },
    },
    500: {
      description: 'Internal server error',
      content: { 'application/json': { schema: CartErrorSchema } },
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
    params: z.object({ courseId: courseIdSchema }),
  },
  responses: {
    200: {
      description: 'Item removed',
      content: {
        'application/json': {
          schema: z.object({ data: z.record(z.string(), z.unknown()) }),
        },
      },
    },
    400: {
      description: 'Invalid courseId',
      content: { 'application/json': { schema: CartErrorSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: CartErrorSchema } },
    },
    500: {
      description: 'Internal server error',
      content: { 'application/json': { schema: CartErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/orders/{id}',
  tags: ['Orders'],
  summary: 'Get order by ID',
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Order details',
      content: { 'application/json': { schema: OrderSchema } },
    },
    404: { description: 'Order not found' },
  },
});

// ─── Document generator ─────────────────────────────────────────────────────────

export function getOpenApiDocument(): ReturnType<
  OpenApiGeneratorV3['generateDocument']
> {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Ithracode API',
      version: '1.0.0',
      description:
        'REST API for Ithracode — courses, learning paths, cart, and orders. Request/response schemas are generated from Zod validation schemas.',
    },
    servers: [{ url: '/api', description: 'API base path' }],
    tags: [
      { name: 'Courses', description: 'Course catalog and management' },
      { name: 'Paths', description: 'Learning paths' },
      { name: 'Cart', description: 'Shopping cart' },
      { name: 'Orders', description: 'Order management' },
    ],
  });
}
