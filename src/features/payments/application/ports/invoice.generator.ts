export type InvoiceInput = {
  orderId: string;
  orderNumber: string;
  userId: string;
  totalCents: number;
  currency: string;
  purchasedCourseIds: string[];
};

export type InvoiceResult = {
  invoiceId: string;
  invoiceNumber: string;
  storagePath: string;
};

export interface InvoiceGenerator {
  generate(input: InvoiceInput): Promise<InvoiceResult>;
}
