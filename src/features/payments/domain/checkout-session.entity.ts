import type { Currency } from '@/generated/prisma/enums';
import type { PaymentProvider } from './payment-provider';

export type CheckoutSessionStatus = 'OPEN' | 'COMPLETE' | 'EXPIRED';

export type CheckoutSessionEntity = {
  id: string;
  orderId: string;
  userId: string;
  provider: PaymentProvider;
  providerSessionId: string;
  status: CheckoutSessionStatus;
  amountCents: number;
  currency: Currency;
  url: string | null;
  expiresAt: Date | null;
  createdAt: Date;
};

export type CreateCheckoutSessionInput = {
  orderId: string;
  userId: string;
  provider: PaymentProvider;
  amountCents: number;
  currency: Currency;
};

export function isCheckoutSessionActive(
  session: Pick<CheckoutSessionEntity, 'status'>,
): boolean {
  return session.status === 'OPEN';
}
