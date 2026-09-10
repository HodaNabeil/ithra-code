import { PaymentProvider } from '@prisma/client';
import { z } from 'zod';

const legacyStripePaymentMetadataSchema = z.object({
  stripeSessionId: z.string().optional(),
  paymentIntentId: z.string().optional(),
});

export const paymobPaymentMetadataSchema = z.object({
  orderId: z.string().optional(),
  intentionId: z.string().optional(),
  transactionId: z.string().optional(),
});

export const paypalPaymentMetadataSchema = z.object({
  orderId: z.string().optional(),
  captureId: z.string().optional(),
});

export type PaymobPaymentMetadata = z.infer<typeof paymobPaymentMetadataSchema>;
export type PaypalPaymentMetadata = z.infer<typeof paypalPaymentMetadataSchema>;

export type PaymentMetadata =
  | { provider: 'PAYMOB'; data: PaymobPaymentMetadata }
  | { provider: 'PAYPAL'; data: PaypalPaymentMetadata }
  | { provider: 'CASH'; data: Record<string, never> };

export function buildPaymobMetadata(
  data: PaymobPaymentMetadata,
): PaymobPaymentMetadata {
  return paymobPaymentMetadataSchema.parse(data);
}

export function buildPaypalMetadata(
  data: PaypalPaymentMetadata,
): PaypalPaymentMetadata {
  return paypalPaymentMetadataSchema.parse(data);
}

export function parsePaymentMetadata(
  provider: PaymentProvider,
  metadata: unknown,
): PaymentMetadata['data'] | Record<string, unknown> {
  switch (provider) {
    case 'STRIPE':
      return legacyStripePaymentMetadataSchema.parse(metadata ?? {});
    case 'PAYMOB':
      return paymobPaymentMetadataSchema.parse(metadata ?? {});
    case 'PAYPAL':
      return paypalPaymentMetadataSchema.parse(metadata ?? {});
    case 'CASH':
      return {};
    default:
      return {};
  }
}
