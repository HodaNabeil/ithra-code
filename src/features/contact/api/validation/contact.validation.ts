import { z } from 'zod';

import { isTurnstileVerificationRequired } from '@/features/contact/lib/turnstile-config';

export const contactFieldsSchema = z.object({
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

export const createContactMessageSchema = contactFieldsSchema.superRefine(
  (data, ctx) => {
    if (isTurnstileVerificationRequired() && !data.turnstileToken?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'تعذر التحقق من الطلب',
        path: ['turnstileToken'],
      });
    }
  },
);

export type CreateContactMessageInput = z.infer<typeof contactFieldsSchema>;

export const CONTACT_SUCCESS_MESSAGE =
  'تم استلام رسالتك بنجاح. سنتواصل معك قريباً.';

export const CONTACT_HONEYPOT_SUCCESS_MESSAGE = CONTACT_SUCCESS_MESSAGE;
