import * as z from 'zod';

// Contact form schema
export const contactSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  message: z.string().min(10, 'يجب أن تتكون الرسالة من 10 أحرف على الأقل'),
});

export type ContactInput = z.infer<typeof contactSchema>;
