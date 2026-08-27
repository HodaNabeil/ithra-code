'use server';

import { headers } from 'next/headers';

import { getClientIpFromHeaders } from '@/lib/client-ip';
import { submitContactMessage } from '@/features/contact/infrastructure/di/contact.container';
import {
  ContactError,
  isContactError,
} from '@/features/contact/domain/errors/contact.errors';
import { contactSchema, type ContactInput } from '@/validation/contact';

export interface ContactResponse {
  success: boolean;
  message: string;
}

function mapContactErrorToMessage(error: ContactError): string {
  switch (error.code) {
    case 'RATE_LIMIT_EXCEEDED':
      return 'تم تجاوز عدد الطلبات المسموح بها. يرجى المحاولة لاحقاً.';
    case 'SECURITY_VERIFICATION_FAILED':
      return 'تعذر التحقق من الطلب. يرجى المحاولة مرة أخرى.';
    case 'VALIDATION_ERROR':
      return error.message;
    default:
      return 'فشل في إرسال الرسالة. يرجى المحاولة مرة أخرى.';
  }
}

export async function contactAction(
  data: ContactInput,
): Promise<ContactResponse> {
  try {
    const validated = contactSchema.safeParse(data);

    if (!validated.success) {
      const message =
        validated.error.issues.map((issue) => issue.message).join(', ') ||
        'بيانات غير صالحة';
      return {
        success: false,
        message,
      };
    }

    const requestHeaders = await headers();
    const ip = getClientIpFromHeaders(requestHeaders);
    const result = await submitContactMessage(validated.data, { ip });

    return {
      success: result.success,
      message: result.message,
    };
  } catch (error: unknown) {
    if (isContactError(error)) {
      return {
        success: false,
        message: mapContactErrorToMessage(error),
      };
    }

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
