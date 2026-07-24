import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import PDFDocument from 'pdfkit';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import type {
  InvoiceGenerator,
  InvoiceInput,
  InvoiceResult,
} from '@/features/payments/application/ports/invoice.generator';

const INVOICE_DIR = path.join(process.cwd(), 'storage', 'invoices');

/**
 * Generates PDF invoices locally and persists an Invoice record.
 */
export class PdfInvoiceGenerator implements InvoiceGenerator {
  async generate(input: InvoiceInput): Promise<InvoiceResult> {
    const existing = await prisma.invoice.findUnique({
      where: { orderId: input.orderId },
    });

    if (existing) {
      return {
        invoiceId: existing.id,
        invoiceNumber: existing.invoiceNumber,
        storagePath: existing.storagePath,
      };
    }

    await mkdir(INVOICE_DIR, { recursive: true });

    const invoiceNumber = `INV-${input.orderNumber}`;
    const storagePath = path.join(INVOICE_DIR, `${input.orderId}.pdf`);

    const courses = await prisma.course.findMany({
      where: { id: { in: input.purchasedCourseIds } },
      select: { title: true, price: true },
    });

    await this.writePdf({
      storagePath,
      invoiceNumber,
      orderNumber: input.orderNumber,
      totalCents: input.totalCents,
      currency: input.currency,
      courses,
    });

    const invoice = await prisma.invoice.upsert({
      where: { orderId: input.orderId },
      create: {
        id: randomUUID(),
        orderId: input.orderId,
        invoiceNumber,
        storagePath,
      },
      update: {
        storagePath,
      },
    });

    logger.info(
      { orderId: input.orderId, invoiceNumber },
      '[INVOICE_GENERATED]',
    );

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      storagePath: invoice.storagePath,
    };
  }

  private async writePdf(input: {
    storagePath: string;
    invoiceNumber: string;
    orderNumber: string;
    totalCents: number;
    currency: string;
    courses: Array<{ title: string; price: unknown }>;
  }): Promise<void> {
    const chunks: Buffer[] = [];

    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve());
      doc.on('error', reject);

      doc.fontSize(20).text('IthraCode Invoice', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Invoice: ${input.invoiceNumber}`);
      doc.text(`Order: ${input.orderNumber}`);
      doc.text(`Date: ${new Date().toISOString().slice(0, 10)}`);
      doc.moveDown();
      doc.text('Items:');

      for (const course of input.courses) {
        doc.text(`- ${course.title}`);
      }

      doc.moveDown();
      doc.text(
        `Total: ${(input.totalCents / 100).toFixed(2)} ${input.currency}`,
      );
      doc.end();
    });

    await writeFile(input.storagePath, Buffer.concat(chunks));
  }
}

export const pdfInvoiceGenerator = new PdfInvoiceGenerator();
