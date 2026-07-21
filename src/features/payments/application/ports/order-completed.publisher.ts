import type { OrderCompletedEvent } from '../events/order-completed.event';

/**
 * Application port for publishing post-fulfillment secondary work.
 * Infrastructure implements this with a queue (BullMQ); the use case never
 * waits on email/invoice/analytics.
 */
export interface OrderCompletedPublisher {
  publish(event: OrderCompletedEvent): Promise<void>;
}
