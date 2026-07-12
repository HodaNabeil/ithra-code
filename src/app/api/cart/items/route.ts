import { auth } from '@/lib/auth';
import { apiError } from '@/lib/api-response';
import { handleAddCartItem } from '@/features/cart/presentation/handlers/add-cart-item.handler';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError('Unauthorized', 401);
  }

  return handleAddCartItem(req, session.user.id);
}
