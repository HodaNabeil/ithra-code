/**
 * Distributed lock for checkout to prevent concurrent duplicate orders.
 */
export interface CheckoutLock {
  acquire(userId: string): Promise<void>;
  /** Extends lock TTL while a long-running provider call is in flight. */
  extend(userId: string): Promise<void>;
  release(userId: string): Promise<void>;
}
