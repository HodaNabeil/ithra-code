import { z } from 'zod';

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'يجب أن يتكون الاسم من حرفين على الأقل')
    .max(100, 'الاسم طويل جداً'),
  email: z
    .string()
    .trim()
    .email('البريد الإلكتروني غير صالح')
    .max(255, 'البريد الإلكتروني طويل جداً'),
  message: z
    .string()
    .trim()
    .min(10, 'يجب أن تتكون الرسالة من 10 أحرف على الأقل')
    .max(5000, 'الرسالة طويلة جداً'),
  turnstileToken: z.string().optional(),
  website: z.string().optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;
