import type { OrderCompletedEvent } from '../events/order-completed.event';

export interface AnalyticsTracker {
  trackPurchaseCompleted(event: OrderCompletedEvent): Promise<void>;
}
