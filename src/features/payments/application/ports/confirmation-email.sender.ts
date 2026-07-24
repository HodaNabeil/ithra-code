export type PurchaseConfirmationEmail = {
  to: string;
  userName: string | null;
  orderId: string;
  orderNumber: string;
  totalCents: number;
  currency: string;
  courseTitles: string[];
};

export interface ConfirmationEmailSender {
  sendPurchaseConfirmation(input: PurchaseConfirmationEmail): Promise<void>;
}
