/**
 * Persistence port for clearing a student's cart after successful payment.
 * Kept separate from the cart feature's `CartRepository` so fulfillment can
 * participate in the payments Unit of Work without coupling to cart reads.
 */
export interface CartFulfillmentRepository {
  /** Removes all cart items (and clears coupon) for the given user. */
  clearForUser(userId: string): Promise<void>;
}
