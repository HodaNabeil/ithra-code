import type { OrderCompletedEvent } from '../events/order-completed.event';
import type { AnalyticsTracker } from '../ports/analytics.tracker';
import type { ConfirmationEmailSender } from '../ports/confirmation-email.sender';
import type { InvoiceGenerator } from '../ports/invoice.generator';

export type PostOrderFulfillmentDeps = {
  confirmationEmailSender: ConfirmationEmailSender;
  invoiceGenerator: InvoiceGenerator;
  analyticsTracker: AnalyticsTracker;
  loadConfirmationEmail: (
    orderId: string,
  ) => Promise<Parameters<ConfirmationEmailSender['sendPurchaseConfirmation']>[0]>;
  loadInvoiceInput: (
    event: OrderCompletedEvent,
  ) => Promise<Parameters<InvoiceGenerator['generate']>[0]>;
};

/**
 * Secondary (non-critical) post-order fulfillment handlers.
 * Failures must never roll back enrollment.
 */
export class PostOrderFulfillmentService {
  constructor(private readonly deps: PostOrderFulfillmentDeps) {}

  async sendConfirmationEmail(event: OrderCompletedEvent): Promise<void> {
    const email = await this.deps.loadConfirmationEmail(event.orderId);
    await this.deps.confirmationEmailSender.sendPurchaseConfirmation(email);
  }

  async generateInvoice(event: OrderCompletedEvent): Promise<void> {
    const input = await this.deps.loadInvoiceInput(event);
    await this.deps.invoiceGenerator.generate(input);
  }

  async trackAnalytics(event: OrderCompletedEvent): Promise<void> {
    await this.deps.analyticsTracker.trackPurchaseCompleted(event);
  }
}
