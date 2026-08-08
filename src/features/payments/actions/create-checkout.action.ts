'use server';

import { APP_ROUTES } from '@/constants/enums';
import {
  CHECKOUT_PROVIDERS,
  PAYMENT_ENDPOINTS,
  type CheckoutProviderApiValue,
} from '@/constants/payment';
import { env } from '@/config/env';
import { HttpError } from '@/lib/http-error';
import { httpServer } from '@/lib/http-server';
import { extractErrorMessage } from '@/lib/error-extractor';
import type { ActionResponse } from '@/types/action';

type CheckoutSessionPayload = {
  id: string;
  orderId: string;
  provider: string;
  amountCents: number;
  url: string;
  expiresAt: string | Date;
  status: string;
};

type CheckoutApiSuccess = {
  data: {
    redirectUrl: string;
    expiresAt: string | Date;
    checkoutSession: CheckoutSessionPayload;
    clientSecret?: string;
    publicKey?: string;
  };
};

type CreateCheckoutResult = {
  redirectUrl: string;
  expiresAt: string | Date;
  orderId: string;
  clientSecret?: string;
  publicKey?: string;
};

const ALLOWED_PROVIDERS = new Set<string>(Object.values(CHECKOUT_PROVIDERS));

const ERROR_MESSAGES = {
  UNAUTHORIZED: 'جلسة المستخدم منتهية، يرجى إعادة تسجيل الدخول',
  EMPTY_CART: 'السلة فارغة. أضف دورةً على الأقل للمتابعة',
  CART_NOT_FOUND: 'لم يتم العثور على السلة',
  ALREADY_ENROLLED: 'أنت مسجل بالفعل في إحدى الدورات الموجودة في السلة',
  OWN_COURSE: 'لا يمكنك شراء دورة تملكها',
  COURSE_NOT_PUBLISHED: 'إحدى الدورات غير متاحة للشراء حالياً',
  COURSE_NOT_FOUND: 'إحدى الدورات غير موجودة',
  INVALID_COUPON: 'رمز الخصم غير صالح',
  UNSUPPORTED_CURRENCY: 'عملة السلة غير مدعومة',
  UNSUPPORTED_PROVIDER: 'وسيلة الدفع غير مدعومة',
  PROVIDER_UNAVAILABLE: 'وسيلة الدفع غير متاحة حالياً، جرّب لاحقاً',
  RATE_LIMIT_EXCEEDED: 'عدد كبير من المحاولات. انتظر قليلاً ثم أعد المحاولة',
  VALIDATION_ERROR: 'بيانات الطلب غير صالحة',
} as const;

function messageForCode(code: string | undefined): string | undefined {
  switch (code) {
    case 'UNAUTHORIZED':
      return ERROR_MESSAGES.UNAUTHORIZED;
    case 'EMPTY_CART':
      return ERROR_MESSAGES.EMPTY_CART;
    case 'CART_NOT_FOUND':
      return ERROR_MESSAGES.CART_NOT_FOUND;
    case 'ALREADY_ENROLLED':
      return ERROR_MESSAGES.ALREADY_ENROLLED;
    case 'OWN_COURSE':
      return ERROR_MESSAGES.OWN_COURSE;
    case 'COURSE_NOT_PUBLISHED':
      return ERROR_MESSAGES.COURSE_NOT_PUBLISHED;
    case 'COURSE_NOT_FOUND':
      return ERROR_MESSAGES.COURSE_NOT_FOUND;
    case 'INVALID_COUPON':
      return ERROR_MESSAGES.INVALID_COUPON;
    case 'UNSUPPORTED_CURRENCY':
      return ERROR_MESSAGES.UNSUPPORTED_CURRENCY;
    case 'UNSUPPORTED_PROVIDER':
      return ERROR_MESSAGES.UNSUPPORTED_PROVIDER;
    case 'PROVIDER_UNAVAILABLE':
      return ERROR_MESSAGES.PROVIDER_UNAVAILABLE;
    case 'RATE_LIMIT_EXCEEDED':
      return ERROR_MESSAGES.RATE_LIMIT_EXCEEDED;
    case 'VALIDATION_ERROR':
      return ERROR_MESSAGES.VALIDATION_ERROR;
    default:
      return undefined;
  }
}

function resolveErrorMessage(error: unknown): string {
  if (error instanceof HttpError) {
    const body = error.data as { code?: string; error?: string } | undefined;
    return (
      messageForCode(body?.code) ??
      extractErrorMessage(error, 'تعذر بدء عملية الدفع')
    );
  }

  return extractErrorMessage(error, 'تعذر بدء عملية الدفع');
}

export async function createCheckoutAction(
  provider: string,
): Promise<ActionResponse<CreateCheckoutResult>> {
  if (!ALLOWED_PROVIDERS.has(provider)) {
    return {
      success: false,
      error: ERROR_MESSAGES.UNSUPPORTED_PROVIDER,
    };
  }

  const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');

  try {
    const response = await httpServer.post<CheckoutApiSuccess>(
      PAYMENT_ENDPOINTS.CHECKOUT,
      {
        provider: provider as CheckoutProviderApiValue,
        successUrl: `${baseUrl}${APP_ROUTES.PAYMENT_SUCCESS}`,
        cancelUrl: `${baseUrl}${APP_ROUTES.PAYMENT_CANCEL}`,
      },
    );

    return {
      success: true,
      data: {
        redirectUrl: response.data.redirectUrl,
        expiresAt: response.data.expiresAt,
        orderId: response.data.checkoutSession.orderId,
        clientSecret: response.data.clientSecret,
        publicKey: response.data.publicKey,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: resolveErrorMessage(error),
    };
  }
}
