import { Resend } from 'resend';
import { env } from '@/config';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import type {
  ConfirmationEmailSender,
  PurchaseConfirmationEmail,
} from '@/features/payments/application/ports/confirmation-email.sender';

/**
 * Sends purchase confirmation emails via Resend when configured.
 */
export class ResendConfirmationEmailSender implements ConfirmationEmailSender {
  private readonly client: Resend | null;

  constructor() {
    this.client = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
  }

  async sendPurchaseConfirmation(
    input: PurchaseConfirmationEmail,
  ): Promise<void> {
    if (!this.client || !env.PAYMENT_EMAIL_FROM) {
      logger.info(
        { orderId: input.orderId, to: input.to },
        '[CONFIRMATION_EMAIL_SKIPPED] Resend not configured',
      );
      return;
    }

    const courseList =
      input.courseTitles.length > 0
        ? input.courseTitles.map((title) => `- ${title}`).join('\n')
        : '- Your courses';

    await this.client.emails.send({
      from: env.PAYMENT_EMAIL_FROM,
      to: input.to,
      subject: `Purchase confirmed — ${input.orderNumber}`,
      text: [
        `Hello${input.userName ? ` ${input.userName}` : ''},`,
        '',
        'Thank you for your purchase on IthraCode.',
        '',
        `Order: ${input.orderNumber}`,
        `Total: ${(input.totalCents / 100).toFixed(2)} ${input.currency}`,
        '',
        'Courses:',
        courseList,
      ].join('\n'),
    });

    logger.info({ orderId: input.orderId }, '[CONFIRMATION_EMAIL_SENT]');
  }
}

export async function buildPurchaseConfirmationEmail(
  orderId: string,
): Promise<PurchaseConfirmationEmail> {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      user: { select: { email: true, name: true } },
      items: {
        include: { course: { select: { title: true } } },
      },
    },
  });

  return {
    to: order.user.email,
    userName: order.user.name,
    orderId: order.id,
    orderNumber: order.orderNumber,
    totalCents: order.totalCents,
    currency: order.currency,
    courseTitles: order.items.map((item) => item.course.title),
  };
}

export const resendConfirmationEmailSender =
  new ResendConfirmationEmailSender();
