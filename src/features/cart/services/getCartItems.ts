import { auth } from '@/lib/auth';
import type { CartDataType } from '@/types/cart/cart';
import { getCartUseCase } from '../use-cases/get-cart.use-case';

export async function getCart(): Promise<{
  success: boolean;
  data: CartDataType;
  message: string;
}> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    const now = new Date().toISOString();
    return {
      success: true,
      data: {
        id: null,
        userId: '',
        subtotal: 0,
        discount: 0,
        total: 0,
        currency: 'EGP',
        items: [],
        coupon: null,
        createdAt: now,
        updatedAt: now,
      },
      message: 'تم جلب بيانات السلة بنجاح',
    };
  }

  const data = await getCartUseCase(userId);

  return {
    success: true,
    data,
    message: 'تم جلب بيانات السلة بنجاح',
  };
}
