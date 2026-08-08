'use server';

import { CONTACT_ENDPOINTS } from '@/constants/contact';
import { http } from '@/lib/http-client';
import { contactSchema, type ContactInput } from '@/validation/contact';

export interface ContactResponse {
  success: boolean;
  message: string;
}

export async function contactAction(data: ContactInput) {
  try {
    const validated = contactSchema.safeParse(data);

    if (!validated.success) {
      return {
        success: false,
        message: validated.error.message || 'بيانات غير صالحة',
      };
    }

    const response = await http.post<ContactResponse>(
      CONTACT_ENDPOINTS.SUBMIT,
      {
        email: validated.data.email,
        message: validated.data.message,
      },
    );

    return {
      success: response.success,
      message: response.message,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'فشل في إرسال الرسالة. يرجى المحاولة مرة أخرى.';
    return {
      success: false,
      message,
    };
  }
}
