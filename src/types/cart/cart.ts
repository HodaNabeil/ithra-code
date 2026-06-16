import type { CourseListDTO as Course } from '../course/course.dto';

export interface CartItemType extends Course {
  totalDurationText: string;
}

export interface CartDataType {
  id: string;
  userId: string | null;
  subtotal: number;
  discount: number;
  total: number;
  currency: string;
  items: CartItemType[];
  coupon: {
    code: string;
    type: string;
    value: number;
    description: string;
  };
  createdAt: string;
  updatedAt: string;
}
