/**
 * Domain event published after the critical fulfillment path commits.
 * Secondary workers (email, invoice, analytics) consume this asynchronously.
 */
export type OrderCompletedEvent = {
  eventId: string;
  timestamp: string;
  orderId: string;
  userId: string;
  totalCents: number;
  currency: string;
  purchasedCourseIds: string[];
};
