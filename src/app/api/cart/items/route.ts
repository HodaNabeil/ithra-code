import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  addCartItem,
  CartServiceError,
} from '@/features/cart/services/cart.service';
import { courseIdSchema } from '@/validation/cart';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = courseIdSchema.safeParse(body?.courseId);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid courseId' },
        { status: 400 },
      );
    }

    const data = await addCartItem(session.user.id, parsed.data);
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof CartServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[CART_ADD_ERROR]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
