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
  currency: 'EGP' as const,
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
  page: z
    .string()
    .optional()
    .openapi({ example: '1', description: 'Page number (1-based)' }),
  limit: z
    .string()
    .optional()
    .openapi({ example: '12', description: 'Items per page' }),
  search: z
    .string()
    .optional()
    .openapi({ example: 'node', description: 'Search in title and description' }),
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

const pathCatalogQuerySchema = z.object({
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
          example: { ...courseExample, title: 'Node.js - دورة محدّثة', price: 549 },
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
              currency: 'EGP',
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

const orderExample = {
  id: EX.orderId,
  orderNumber: 'ORD-2026-0001',
  userId: 'cluser2k4m000008l5d6e3k1n',
  subtotalCents: 49900,
  discountCents: 0,
  taxCents: 0,
  totalCents: 49900,
  currency: 'EGP' as const,
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
      currency: 'EGP' as const,
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

// ─── Document generator ─────────────────────────────────────────────────────────

export function getOpenApiDocument(): ReturnType<
  OpenApiGeneratorV3['generateDocument']
> {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'thracode',
      version: '1.0',
      description: 'API Documentation',
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
