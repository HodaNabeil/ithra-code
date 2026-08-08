import { apiError, apiSuccess } from '@/lib/api-response';
import { addCartItemUseCase } from '../../application/use-cases/add-cart-item.use-case';
import { CartError } from '../../domain/errors/cart.errors';
import { addCartItemBodySchema } from '../validators/add-cart-item.validator';

/** HTTP handler for POST /api/cart/items — auth must be verified by the route. */
export async function handleAddCartItem(req: Request, userId: string) {
  try {
    const body = await req.json();
    const parsed = addCartItemBodySchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        parsed.error.issues[0]?.message ?? 'بيانات الطلب غير صالحة',
        400,
      );
    }

    const data = await addCartItemUseCase({
      userId,
      courseId: parsed.data.courseId,
    });

    return apiSuccess(data, 'تمت إضافة الدورة إلى السلة');
  } catch (error) {
    if (error instanceof CartError) {
      return apiError(error.message, error.status);
    }
    console.error('[CART_ADD_ERROR]', error);
    return apiError('Internal Error', 500);
  }
}
