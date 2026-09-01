import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  removeCartItem,
  CartServiceError,
} from '@/features/cart/services/cart.service';
import { courseIdSchema } from '@/validation/cart';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await params;
    const parsed = courseIdSchema.safeParse(courseId);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid courseId' },
        { status: 400 },
      );
    }

    const data = await removeCartItem(session.user.id, parsed.data);
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof CartServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error('[CART_REMOVE_ERROR]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
