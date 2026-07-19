'use server';

/**
 * Cart Server Actions — the only mutation boundary for authenticated cart operations.
 *
 * Architecture:
 * - Client components never call API routes directly; they invoke these actions.
 * - Actions communicate with backend via `httpServer` (server-side HTTP client).
 * - Guest cart add/remove stays client-side (localStorage via useGuestCart).
 * - On login, guest cart IDs are staged in a cookie before OAuth; the NextAuth
 *   signIn event merges them via syncGuestCartUseCase.
 */

import { revalidatePath } from 'next/cache';
import { CART_ENDPOINTS } from '@/constants/cart';
import { syncGuestCartUseCase } from '@/features/cart/application/use-cases/sync-guest-cart.use-case';
import { setPendingGuestCartCookie } from '@/features/cart/lib/pending-guest-cart.cookie';
import { auth } from '@/lib/auth';
import { HttpError } from '@/lib/http-error';
import { httpServer } from '@/lib/http-server';
import { extractErrorMessage } from '@/lib/error-extractor';
import type { ActionResponse, GuestCartSyncSummary } from '@/types/action';
import type { CartDataType } from '@/types/cart/cart';
import { courseIdSchema, courseIdsSchema } from '@/validation/cart';

type CartApiResponse = {
  success: true;
  message: string;
  data: CartDataType;
};

function mapCartError(error: unknown, fallback: string): ActionResponse<never> {
  if (error instanceof HttpError) {
    if (error.status === 401) {
      return {
        success: false,
        error: 'جلسة المستخدم منتهية، يرجى إعادة تسجيل الدخول',
      };
    }
    if (error.status === 409) {
      return {
        success: false,
        error: extractErrorMessage(error, 'تعارض في بيانات السلة'),
      };
    }
    return {
      success: false,
      error: extractErrorMessage(error, fallback),
    };
  }

  return {
    success: false,
    error: extractErrorMessage(error, fallback),
  };
}

export async function addToCartAction(
  _prev: ActionResponse<CartDataType> | null,
  courseId: string,
  _formData?: FormData,
): Promise<ActionResponse<CartDataType>> {
  const parsed = courseIdSchema.safeParse(courseId);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'معرّف الدورة غير صالح',
    };
  }

  try {
    const response = await httpServer.post<CartApiResponse>(
      CART_ENDPOINTS.ITEMS,
      { courseId: parsed.data },
    );

    revalidatePath('/cart');
    revalidatePath('/courses', 'layout');

    return {
      success: true,
      data: response.data,
      message: response.message ?? 'تمت إضافة الدورة إلى السلة',
    };
  } catch (error) {
    console.error('[ADD_TO_CART_ACTION]', error);
    return mapCartError(error, 'فشلت عملية الإضافة');
  }
}

export async function removeFromCartAction(
  courseId: string,
): Promise<ActionResponse<CartDataType>> {
  const parsed = courseIdSchema.safeParse(courseId);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'معرّف الدورة غير صالح',
    };
  }

  try {
    const response = await httpServer.delete<CartApiResponse>(
      CART_ENDPOINTS.ITEM(parsed.data),
    );

    revalidatePath('/cart');
    revalidatePath('/courses', 'layout');

    return {
      success: true,
      data: response.data,
      message: 'تمت إزالة الدورة من السلة',
    };
  } catch (error) {
    console.error('[REMOVE_FROM_CART_ACTION]', error);
    return mapCartError(error, 'فشل حذف الدورة');
  }
}

export async function stageGuestCartForLoginAction(
  courseIds: string[],
): Promise<ActionResponse<{ staged: number }>> {
  const uniqueIds = [...new Set(courseIds)];

  if (uniqueIds.length === 0) {
    return { success: true, data: { staged: 0 } };
  }

  const parsed = courseIdsSchema.safeParse(uniqueIds);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'قائمة الدورات غير صالحة',
    };
  }

  await setPendingGuestCartCookie(parsed.data);

  return {
    success: true,
    data: { staged: parsed.data.length },
  };
}

export async function syncGuestCartAction(
  courseIds: string[],
): Promise<ActionResponse<GuestCartSyncSummary>> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      success: false,
      error: 'يجب تسجيل الدخول لمزامنة السلة',
    };
  }

  const uniqueIds = [...new Set(courseIds)];

  if (uniqueIds.length === 0) {
    return { success: true, data: { synced: 0, failed: 0 } };
  }

  const parsed = courseIdsSchema.safeParse(uniqueIds);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'قائمة الدورات غير صالحة',
    };
  }

  const summary = await syncGuestCartUseCase(userId, parsed.data);

  if (summary.synced > 0) {
    revalidatePath('/cart');
    revalidatePath('/courses', 'layout');
  }

  return {
    success: true,
    data: summary,
    message:
      summary.failed > 0
        ? `تمت مزامنة ${summary.synced} دورة، فشلت ${summary.failed}`
        : `تمت مزامنة ${summary.synced} دورة بنجاح`,
  };
}
