import { z } from '@/lib/zod-openapi';

export const cartCouponSchema = z
  .object({
    code: z.string(),
    type: z.string(),
    value: z.number(),
    description: z.string().nullable(),
  })
  .openapi({ description: 'Applied coupon details' });

export const cartItemSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
    price: z.number(),
    compareAtPrice: z.number().nullable(),
    currency: z.string(),
    thumbnailUrl: z.string(),
    totalDurationText: z.string(),
  })
  .passthrough()
  .openapi({ description: 'Course line item in the cart' });

export const cartDataSchema = z
  .object({
    id: z.string().nullable(),
    userId: z.string(),
    subtotal: z.number(),
    discount: z.number(),
    total: z.number(),
    currency: z.string(),
    items: z.array(cartItemSchema),
    coupon: cartCouponSchema.nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    warnings: z.array(z.string()).optional(),
  })
  .openapi({ description: 'Authenticated user cart' });

export const cartApiResponseSchema = z
  .object({
    success: z.literal(true),
    message: z.string(),
    data: cartDataSchema,
  })
  .openapi({ description: 'Cart API success response' });
