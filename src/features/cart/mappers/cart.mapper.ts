import { CourseStatus, CourseVisibility, CouponType } from '@prisma/client';
import { DEFAULT_CURRENCY } from '@/constants/currency';
import type { CartDataType, CartItemType } from '@/types/cart/cart';
import type {
  DB_CartCoupon,
  DB_CartItemCourse,
  DB_CartWithItems,
} from '../infrastructure/prisma/cart.select';

function countLectures(course: DB_CartItemCourse): number {
  return course.sections.reduce(
    (acc, section) => acc + section._count.lectures,
    0,
  );
}

function formatDurationText(course: DB_CartItemCourse): string {
  const lecturesCount = countLectures(course);
  const totalSeconds = course.duration ?? 0;

  if (totalSeconds > 0) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return hours > 0 ? `${hours} ساعة و ${minutes} دقيقة` : `${minutes} دقيقة`;
  }

  return lecturesCount > 0 ? `${lecturesCount} محاضرة` : '';
}

export function mapCartItemCourse(
  course: DB_CartItemCourse,
  snapshotPrice: number,
): CartItemType {
  const lecturesCount = countLectures(course);
  const totalSeconds = course.duration ?? 0;
  const hours = totalSeconds > 0 ? Math.floor(totalSeconds / 3600) : null;

  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    thumbnailUrl: course.thumbnailUrl,
    price: snapshotPrice,
    compareAtPrice: course.compareAtPrice
      ? Number(course.compareAtPrice)
      : null,
    currency: course.currency,
    duration: course.duration,
    level: course.level,
    objectives: course.objectives ?? [],
    rating: 0,
    ratingCount: 0,
    lecturesCount,
    hours: hours && hours > 0 ? hours : null,
    totalDurationText: formatDurationText(course),
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
    publishedAt: course.publishedAt?.toISOString() ?? null,
  };
}

export function isCourseAvailable(course: DB_CartItemCourse): boolean {
  return (
    course.status === CourseStatus.PUBLISHED &&
    course.visibility === CourseVisibility.PUBLIC
  );
}

export function isCouponValid(
  coupon: DB_CartCoupon,
  subtotal: number,
  now = new Date(),
): boolean {
  if (!coupon.isActive) return false;
  if (coupon.startsAt && coupon.startsAt > now) return false;
  if (coupon.expiresAt && coupon.expiresAt < now) return false;
  if (
    coupon.minOrderAmount !== null &&
    subtotal < Number(coupon.minOrderAmount)
  ) {
    return false;
  }
  return true;
}

export function calculateDiscount(
  subtotal: number,
  coupon: DB_CartCoupon,
): number {
  const value = Number(coupon.value);

  if (coupon.type === CouponType.PERCENTAGE) {
    return parseFloat((subtotal * (value / 100)).toFixed(2));
  }

  return parseFloat(Math.min(value, subtotal).toFixed(2));
}

export function mapCoupon(coupon: DB_CartCoupon) {
  return {
    code: coupon.code,
    type: coupon.type,
    value: Number(coupon.value),
    description: coupon.description,
  };
}

export function emptyCartDto(userId: string): CartDataType {
  const now = new Date().toISOString();

  return {
    id: null,
    userId,
    subtotal: 0,
    discount: 0,
    total: 0,
    currency: DEFAULT_CURRENCY,
    items: [],
    coupon: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function mapCartToDto(
  dbCart: DB_CartWithItems,
  userId: string,
  options?: {
    discount?: number;
    coupon?: DB_CartCoupon | null;
    warnings?: string[];
  },
): CartDataType {
  const items: CartItemType[] = dbCart.items.map((item) =>
    mapCartItemCourse(item.course, Number(item.price)),
  );

  const subtotal = parseFloat(
    items.reduce((acc, item) => acc + item.price, 0).toFixed(2),
  );
  const discount = options?.discount ?? Number(dbCart.discount);
  const total = parseFloat(Math.max(subtotal - discount, 0).toFixed(2));
  const coupon =
    options && 'coupon' in options
      ? options.coupon
        ? mapCoupon(options.coupon)
        : null
      : dbCart.coupon
        ? mapCoupon(dbCart.coupon)
        : null;

  return {
    id: dbCart.id,
    userId,
    subtotal,
    discount: parseFloat(discount.toFixed(2)),
    total,
    currency: items[0]?.currency ?? dbCart.currency,
    items,
    coupon,
    createdAt: dbCart.createdAt.toISOString(),
    updatedAt: dbCart.updatedAt.toISOString(),
    ...(options?.warnings?.length ? { warnings: options.warnings } : {}),
  };
}
