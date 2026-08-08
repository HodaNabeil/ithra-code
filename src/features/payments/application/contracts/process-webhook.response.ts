export type ProcessWebhookResponse = {
  /** True when this delivery was a duplicate and fulfillment was skipped. */
  duplicate: boolean;
  /** True when the critical fulfillment path ran for a successful payment. */
  fulfilled: boolean;
  orderId: string;
};
