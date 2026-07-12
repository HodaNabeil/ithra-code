import type { CourseListDTO as Course } from '../course/course.dto';

export interface CartItemType extends Course {
  totalDurationText: string;
}

export interface CartCouponType {
  code: string;
  type: string;
  value: number;
  description: string | null;
}

export interface CartDataType {
  id: string | null;
  userId: string;
  subtotal: number;
  discount: number;
  total: number;
  currency: string;
  items: CartItemType[];
  coupon: CartCouponType | null;
  createdAt: string;
  updatedAt: string;
  warnings?: string[];
}
