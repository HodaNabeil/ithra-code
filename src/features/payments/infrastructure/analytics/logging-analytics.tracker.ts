import { env } from '@/config';
import { logger } from '@/lib/logger';
import type { OrderCompletedEvent } from '@/features/payments/application/events/order-completed.event';
import type { AnalyticsTracker } from '@/features/payments/application/ports/analytics.tracker';

/**
 * Logs purchase analytics events. No-op adapter until a real provider is wired.
 */
export class LoggingAnalyticsTracker implements AnalyticsTracker {
  async trackPurchaseCompleted(event: OrderCompletedEvent): Promise<void> {
    if (env.PAYMENT_ANALYTICS_ENABLED !== 'true') {
      logger.info(
        { orderId: event.orderId },
        '[ANALYTICS_PURCHASE_COMPLETED] analytics disabled',
      );
      return;
    }

    logger.info(
      {
        orderId: event.orderId,
        userId: event.userId,
        totalCents: event.totalCents,
        currency: event.currency,
        courses: event.purchasedCourseIds,
      },
      '[ANALYTICS_PURCHASE_COMPLETED]',
    );
  }
}

export const loggingAnalyticsTracker = new LoggingAnalyticsTracker();
