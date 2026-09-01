import { z } from 'zod';

/**
 * Schema for creating a new testimonial (admin only).
 */
export const createTestimonialSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  avatarUrl: z.string().url('Invalid avatar URL').optional().nullable(),
  content: z
    .string()
    .min(10, 'Content must be at least 10 characters')
    .max(1000, 'Content is too long'),
  rating: z
    .number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  isActive: z.boolean().optional(),
});

/**
 * Schema for updating an existing testimonial (admin only).
 * All fields are optional.
 */
export const updateTestimonialSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long').optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional().nullable(),
  content: z
    .string()
    .min(10, 'Content must be at least 10 characters')
    .max(1000, 'Content is too long')
    .optional(),
  rating: z
    .number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5')
    .optional(),
  isActive: z.boolean().optional(),
});

export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>;
export type UpdateTestimonialInput = z.infer<typeof updateTestimonialSchema>;
