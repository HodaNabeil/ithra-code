import { z } from '@/lib/zod-openapi';
import { courseIdSchema } from '@/validation/cart';
import type { CartDataType } from '@/types/cart/cart';

export const addCartItemBodySchema = z
  .object({
    courseId: courseIdSchema,
  })
  .openapi({ description: 'Add a course to the authenticated user cart' });

export type AddCartItemBodyDTO = z.infer<typeof addCartItemBodySchema>;

export type AddCartItemInputDTO = {
  userId: string;
  courseId: string;
};

export type AddCartItemOutputDTO = CartDataType;
