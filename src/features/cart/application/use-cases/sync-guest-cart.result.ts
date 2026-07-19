import type { GuestCartSyncSummary } from '@/types/action';
import {
  CART_ERROR_CODES,
  type CartErrorCode,
  isCartErrorWithAnyCode,
} from '../../domain/errors/cart.errors';

export const PROMISE_SETTLED_STATUS = {
  FULFILLED: 'fulfilled',
  REJECTED: 'rejected',
} as const;

/** Cart errors that mean the guest item is already represented server-side. */
export const GUEST_CART_IDEMPOTENT_SYNC_CODES: ReadonlySet<CartErrorCode> =
  new Set([CART_ERROR_CODES.ALREADY_IN_CART]);

export function isGuestCartSyncSuccess(
  result: PromiseSettledResult<unknown>,
): boolean {
  if (result.status === PROMISE_SETTLED_STATUS.FULFILLED) {
    return true;
  }

  return isCartErrorWithAnyCode(result.reason, GUEST_CART_IDEMPOTENT_SYNC_CODES);
}

export function summarizeGuestCartSyncResults(
  results: PromiseSettledResult<unknown>[],
): GuestCartSyncSummary {
  let synced = 0;
  let failed = 0;

  for (const result of results) {
    if (isGuestCartSyncSuccess(result)) {
      synced++;
      continue;
    }

    failed++;
  }

  return { synced, failed };
}
