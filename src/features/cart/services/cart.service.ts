import { prisma } from '@/lib/prisma';
import { EnrollmentStatus, Prisma } from '@prisma/client';
import type { CartDataType } from '@/types/cart/cart';

/** Thrown by cart service; API routes map `status` to HTTP responses. */
export class CartServiceError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'CartServiceError';
  }
}

const cartInclude = {
  items: {
    include: {
      course: {
        include: {
          sections: {
            include: { lectures: { select: { video: { select: { duration: true } } } } },
          },
        },
      },
    },
  },
} satisfies Prisma.CartInclude;

export type CartWithItems = Prisma.CartGetPayload<{
  include: typeof cartInclude;
}>;

type CourseWithContent = Prisma.CourseGetPayload<{
  include: {
    sections: {
      include: { lectures: { select: { video: { select: { duration: true } } } } };
    };
  };
}>;

function serializeCourseItem(course: CourseWithContent) {
  const allLectures = course.sections?.flatMap((s) => s.lectures) || [];
  const totalLectures = allLectures.length;
  const totalSeconds = allLectures.reduce(
    (acc, lec) => acc + (lec.video?.duration ?? 0),
    0,
  );

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return {
    ...course,
    price: Number(course.price),
    compareAtPrice: course.compareAtPrice ? Number(course.compareAtPrice) : null,
    objectives: course.objectives ?? [],
    rating: 0,
    ratingCount: 0,
    lecturesCount: totalLectures,
    hours: hours > 0 ? hours : null,
    totalDurationText:
      hours > 0 ? `${hours} ساعة و ${minutes} دقيقة` : `${minutes} دقيقة`,
    createdAt: course.createdAt?.toISOString(),
    updatedAt: course.updatedAt?.toISOString(),
    publishedAt: course.publishedAt?.toISOString() || null,
    sections: undefined,
  };
}

export function serializeCart(
  dbCart: CartWithItems | null,
  userId: string,
): CartDataType {
  const courses =
    dbCart?.items.map((item) => item.course as CourseWithContent) ?? [];
  const serializedItems = courses.map(serializeCourseItem);

  const subtotal = serializedItems.reduce((acc, item) => acc + item.price, 0);
  const discount = dbCart ? Number(dbCart.discount) : 0;
  const total = dbCart ? Number(dbCart.total) : subtotal - discount;

  return {
    id: dbCart?.id ?? 'guest',
    userId,
    subtotal: parseFloat(subtotal.toFixed(2)),
    discount: parseFloat(discount.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
    currency: serializedItems[0]?.currency || dbCart?.currency || 'EGP',
    items: serializedItems,
    coupon: {
      code: 'NONE',
      type: 'PERCENTAGE',
      value: 0,
      description: 'لا يوجد كود خصم',
    },
    createdAt: dbCart?.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: dbCart?.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

async function getOrCreateCart(userId: string): Promise<CartWithItems> {
  const existing = await prisma.cart.findUnique({
    where: { userId },
    include: cartInclude,
  });

  if (existing) return existing;

  return prisma.cart.create({
    data: { userId },
    include: cartInclude,
  });
}

async function loadCart(userId: string): Promise<CartWithItems | null> {
  return prisma.cart.findUnique({
    where: { userId },
    include: cartInclude,
  });
}

export async function addCartItem(
  userId: string,
  courseId: string,
): Promise<CartDataType> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, price: true },
  });

  if (!course) {
    throw new CartServiceError(404, 'هذه الدورة غير موجودة');
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: { studentId: userId, courseId },
    },
    select: { status: true },
  });

  if (enrollment?.status === EnrollmentStatus.ACTIVE) {
    throw new CartServiceError(409, 'لقد اشتريت هذه الدورة مسبقاً');
  }

  const cart = await getOrCreateCart(userId);

  const existingItem = cart.items.find((item) => item.courseId === courseId);
  if (existingItem) {
    throw new CartServiceError(409, 'هذه الدورة موجودة بالفعل في السلة');
  }

  await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      courseId,
      price: course.price,
    },
  });

  const updatedCart = await loadCart(userId);
  return serializeCart(updatedCart, userId);
}

export async function removeCartItem(
  userId: string,
  courseId: string,
): Promise<CartDataType> {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (cart) {
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id, courseId },
    });
  }

  const updatedCart = await loadCart(userId);
  return serializeCart(updatedCart, userId);
}
