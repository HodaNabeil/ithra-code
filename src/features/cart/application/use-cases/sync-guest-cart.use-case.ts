import type { GuestCartSyncSummary } from '@/types/action';
import { courseIdsSchema } from '@/validation/cart';
import { addCartItemUseCase } from './add-cart-item.use-case';
import { summarizeGuestCartSyncResults } from './sync-guest-cart.result';

export async function syncGuestCartUseCase(
  userId: string,
  courseIds: string[],
): Promise<GuestCartSyncSummary> {
  const uniqueIds = [...new Set(courseIds)];

  if (uniqueIds.length === 0) {
    return { synced: 0, failed: 0 };
  }

  const parsed = courseIdsSchema.safeParse(uniqueIds);
  if (!parsed.success) {
    return { synced: 0, failed: uniqueIds.length };
  }

  const results = await Promise.allSettled(
    parsed.data.map((courseId) => addCartItemUseCase({ userId, courseId })),
  );

  return summarizeGuestCartSyncResults(results);
}
