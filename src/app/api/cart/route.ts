import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  CartServiceError,
  clearCart,
} from '@/features/cart/services/cart.service';
import { getCartUseCase } from '@/features/cart/use-cases/get-cart.use-case';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await getCartUseCase(session.user.id);
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof CartServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error('[CART_GET_ERROR]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await clearCart(session.user.id);
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof CartServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error('[CART_CLEAR_ERROR]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
