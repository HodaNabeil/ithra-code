import { z } from '@/lib/zod-openapi';

export const addCartItemBodySchema = z
  .object({
    courseId: z
      .string()
      .min(1, 'معرف الدورة مطلوب')
      .cuid('معرف الدورة غير صالح (تنسيق CUID مطلوب)')
      .openapi({
        example: 'clg2v3z5f000008l5d6e3k1n',
        description: 'The unique CUID of the course to add to the cart',
      }),
  })
  .openapi({
    description: 'Request body to add an item to the shopping cart',
  });

export type AddCartItemInput = z.infer<typeof addCartItemBodySchema>;
