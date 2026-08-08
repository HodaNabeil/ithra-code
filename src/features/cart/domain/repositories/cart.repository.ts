import type { Currency } from '@/generated/prisma/enums';
import type { DB_CartWithItems } from '../../infrastructure/prisma/cart.select';

export type CartTotals = {
  subtotal: number;
  discount: number;
  total: number;
};

export type AddCartItemInput = {
  cartId: string;
  courseId: string;
  price: number;
  currency: Currency;
};

export interface CartRepository {
  findByUserId(userId: string): Promise<DB_CartWithItems | null>;
  findOrCreateByUserId(userId: string): Promise<DB_CartWithItems>;
  addItem(input: AddCartItemInput): Promise<void>;
  updateCurrency(cartId: string, currency: Currency): Promise<void>;
  updateTotals(cartId: string, totals: CartTotals): Promise<void>;
  clearCoupon(cartId: string): Promise<void>;
  removeItems(cartId: string, courseIds: string[]): Promise<void>;
  clearItems(cartId: string): Promise<void>;
  findActiveEnrollmentCourseIds(
    userId: string,
    courseIds: string[],
  ): Promise<Set<string>>;
}
