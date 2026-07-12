import { Prisma } from '@prisma/client';

export const cartItemCourseSelect = Prisma.validator<Prisma.CourseSelect>()({
  id: true,
  title: true,
  slug: true,
  description: true,
  thumbnailUrl: true,
  price: true,
  compareAtPrice: true,
  currency: true,
  level: true,
  objectives: true,
  status: true,
  visibility: true,
  duration: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  sections: {
    select: {
      _count: {
        select: { lectures: true },
      },
    },
  },
});

export const cartCouponSelect = Prisma.validator<Prisma.CouponSelect>()({
  id: true,
  code: true,
  description: true,
  type: true,
  value: true,
  isActive: true,
  startsAt: true,
  expiresAt: true,
  minOrderAmount: true,
});

export const cartWithItemsInclude = Prisma.validator<Prisma.CartInclude>()({
  coupon: { select: cartCouponSelect },
  items: {
    orderBy: { addedAt: 'asc' },
    include: {
      course: { select: cartItemCourseSelect },
    },
  },
});

export type DB_CartItemCourse = Prisma.CourseGetPayload<{
  select: typeof cartItemCourseSelect;
}>;

export type DB_CartCoupon = Prisma.CouponGetPayload<{
  select: typeof cartCouponSelect;
}>;

export type DB_CartWithItems = Prisma.CartGetPayload<{
  include: typeof cartWithItemsInclude;
}>;
